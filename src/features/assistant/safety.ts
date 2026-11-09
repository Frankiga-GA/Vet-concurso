import type { z } from "zod";
import { classification, type AssistantReply } from "./contract";
import type { ModelGuidance } from "./provider";

const urgentSignals = [
  /\b(?:no (?:puede )?respira(?:r)?|(?:le )?cuesta respirar|dificultad (?:para|al) respirar|se (?:esta )?asfixia|atraganta)/,
  /\b(?:convulsion|inconsciente|se desplomo|no (?:despierta|reacciona)|colapso)/,
  /\b(?:sangra mucho|sangrado (?:abundante|intenso)|hemorragia|enc[ií]as (?:azules|blancas))\b/,
  /\b(?:no (?:puede )?orina(?:r)?|no hace (?:pis|pipi)|intenta orinar y no)/,
  /\b(?:atropell|envenen|intoxic|veneno|raticida|golpe de calor|dolor intenso)/,
  /\b(?:comio|trago|tomo|ingirio)\b.{0,28}\b(?:chocolate|medicamentos?|ibuprofeno|paracetamol|lejia|pila|bateria|veneno)\b/,
];

export function hasUrgency(messages: string[]) {
  return messages.some((message) => {
    const normalized = message.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/\s+/g, " ");
    return urgentSignals.some((signal) => signal.test(normalized));
  });
}

export function minimizePersonalData(message: string) {
  return message.replace(/https?:\/\/\S+|www\.\S+/gi, "[enlace omitido]")
    .replace(/[\p{L}\p{N}_.%+\-]+@[\p{L}\p{N}.\-]+\.[\p{L}]{2,}/gu, "[correo omitido]")
    .replace(/(?:\+?\d[().\s-]*){7,}\d|\b\d{8,}\b/g, "[número omitido]");
}

export function localConversationIntent(message: string): z.infer<typeof classification>["intent"] | null {
  const text = message.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().trim();
  if (/^(?:hola|buenas|buenos dias|buenas tardes|buenas noches)[!,. ]*$/.test(text)) return "greeting";
  if (/^(?:gracias|muchas gracias|te agradezco|genial)[!,. ]*$/.test(text)) return "thanks";
  if (/(?:que puedes hacer|como puedes ayudar|para que sirves|que haces)/.test(text)) return "capabilities";
  if (/(?:medicamento|medicina|dosis|ibuprofeno|paracetamol|antibiotico)/.test(text)) return "medication";
  return null;
}

/** A focused follow-up prevents a vague answer when appetite is the concern. */
export function appetiteFollowUp(message: string) {
  const text = message.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
  return /(?:no quiere comer|no come|sin apetito|dejo de comer|ha dejado de comer)/.test(text)
    ? "¿Desde cuándo ocurre? ¿Está bebiendo agua y se comporta como siempre?"
    : null;
}

export function appetiteGuidance(message: string): ModelGuidance | undefined {
  if (!appetiteFollowUp(message)) return undefined;
  return {
    text: "Entiendo que te preocupe. Observa cómo se encuentra hoy y contacta a una veterinaria si el cambio se mantiene o empeora.",
    question: "¿Desde cuándo ocurre? ¿Está bebiendo agua y se comporta como siempre?",
  };
}

export function emergencyReply(): AssistantReply {
  return { source: "safety", urgent: true, clinics: [], question: null,
    text: "Busca atención veterinaria inmediata. Llama a un establecimiento cercano o acude directamente. No esperes una respuesta del asistente ni la confirmación de una cita en línea." };
}

const observation = {
  general: "Cuéntame un poco más de lo que observas para orientar los siguientes pasos.",
  digestive: "Los cambios en el apetito o la digestión merecen observarse con atención.",
  skin: "Los cambios en la piel conviene describirlos por zona, evolución y molestias.",
  mobility: "Los cambios al caminar o moverse merecen una valoración si persisten.",
  prevention: "Un veterinario puede orientar el cuidado preventivo según la especie, la edad y los antecedentes.",
  outside_scope: "Puedo orientar sobre cuidados generales y ayudarte a encontrar una veterinaria.",
};
const followUp = {
  none: null, animal: "¿Qué animal es y qué edad aproximada tiene?",
  onset: "¿Desde cuándo ocurre y con qué frecuencia?",
  change: "¿Ha cambiado su comportamiento habitual desde que empezó?",
};

export function renderGuidance(result: z.infer<typeof classification>, guidance?: ModelGuidance): AssistantReply {
  if (result.level === "urgent") return { ...emergencyReply(), source: "assistant" };
  if (result.intent === "greeting") return { source: "assistant", urgent: false, clinics: [], question: "¿En qué puedo ayudarte con tu mascota?", text: "¡Hola! 🐾 Soy VetIA, tu asistente de orientación veterinaria." };
  if (result.intent === "thanks") return { source: "assistant", urgent: false, clinics: [], question: null, text: "¡Con gusto! Si necesitas orientación sobre tu mascota, aquí estoy." };
  if (result.intent === "capabilities") return { source: "assistant", urgent: false, clinics: [], question: "¿Qué te gustaría consultar?", text: "Puedo orientarte sobre cuidados generales, prevención, alimentación e higiene, síntomas y señales para saber cuándo conviene consultar a una veterinaria. No reemplazo una evaluación profesional." };
  if (result.intent === "medication") return { source: "assistant", urgent: false, clinics: [], question: "¿Qué síntomas has notado y desde cuándo?", text: "No puedo indicar medicamentos ni dosis para tu mascota. Evita administrar medicamentos humanos o tratamientos por tu cuenta; un veterinario puede indicar la opción segura según su evaluación." };
  if (guidance) return { source: "assistant", urgent: false, clinics: [], question: guidance.question, text: guidance.text };
  if (result.level === "clarify") return { source: "assistant", urgent: false, clinics: [], question: "¿Desde cuándo notas el cambio? ¿Está bebiendo agua y se comporta como siempre?", text: "Entiendo que te preocupe. Para ubicar mejor la situación, necesito un poco más de contexto." };
  const recommendation = result.level === "general"
    ? "Si hay síntomas, persisten o empeoran, consulta a un veterinario."
    : "Contacta a un veterinario para valorar lo que ocurre. Por chat no podemos descartar una urgencia.";
  return { source: "assistant", urgent: false, clinics: [], question: followUp[result.question],
    text: `${observation[result.topic]} ${recommendation}` };
}
