import type { z } from "zod";
import { classification, type AssistantReply } from "./contract";

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

export function emergencyReply(): AssistantReply {
  return { source: "safety", urgent: true, clinics: [], question: null,
    text: "Busca atención veterinaria inmediata. Llama a un establecimiento cercano o acude directamente. No esperes una respuesta del asistente ni la confirmación de una cita en línea." };
}

const observation = {
  general: "Anota qué cambió y desde cuándo para explicárselo a un profesional.",
  digestive: "Anota cuándo empezó, la frecuencia y cualquier cambio en el apetito o al beber.",
  skin: "Anota en qué zona empezó el cambio y si se está extendiendo.",
  mobility: "Anota desde cuándo le cuesta moverse y si hubo una caída o un golpe.",
  prevention: "Un veterinario puede orientar el cuidado preventivo según la especie, la edad y los antecedentes.",
  outside_scope: "Puedo orientar sobre cuidados generales y ayudarte a encontrar una veterinaria.",
};
const followUp = {
  none: null, animal: "¿Qué animal es y qué edad aproximada tiene?",
  onset: "¿Desde cuándo ocurre y con qué frecuencia?",
  change: "¿Ha cambiado su comportamiento habitual desde que empezó?",
};

export function renderGuidance(result: z.infer<typeof classification>): AssistantReply {
  if (result.level === "urgent") return { ...emergencyReply(), source: "assistant" };
  const recommendation = result.level === "general"
    ? "Si hay síntomas, persisten o empeoran, consulta a un veterinario."
    : "Contacta a un veterinario para valorar lo que ocurre. Por chat no podemos descartar una urgencia.";
  return { source: "assistant", urgent: false, clinics: [], question: followUp[result.question],
    text: `${observation[result.topic]} ${recommendation}` };
}
