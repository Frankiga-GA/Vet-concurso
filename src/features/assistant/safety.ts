import type { z } from "zod";
import { classification, type AssistantReply, type publicSuggestion } from "./contract";
import type { ModelGuidance } from "./provider";

const urgentSignals = [
  /\b(?:no (?:puede )?respira(?:r)?|(?:le )?cuesta respirar|dificultad (?:para|al) respirar|se (?:esta )?asfixia|atraganta)/,
  /\b(?:convulsion|inconsciente|se desplomo|no (?:despierta|reacciona)|colapso)/,
  /\b(?:sangra mucho|sangrado (?:abundante|intenso)|hemorragia|enc[ií]as (?:azules|blancas))\b/,
  /\b(?:no (?:puede )?orina(?:r)?|no hace (?:pis|pipi)|intenta orinar y no)/,
  /\b(?:atropell|envenen|intoxic|veneno|raticida|golpe de calor|dolor intenso)/,
  /\b(?:comio|trago|tomo|ingirio)\b.{0,28}\b(?:chocolate|medicamentos?|ibuprofeno|paracetamol|lejia|pila|bateria|veneno)\b/,
];

const agroUrgentSignals = [
  /\b(?:aftosa|vesiculas? en (?:boca|hocico|pezon|pezuña)|aftas? en ubre|babeo excesivo)/,
  /\b(?:peste porcina|porcina clasica|cianosis en orejas|manchas moradas en (?:cerdos?|lechones?))/,
  /\b(?:gripe aviar|influenza aviar|muerte masiva (?:de )?(?:pollos|gallinas|aves)|cresta morada|cresta cianotica)/,
  /\b(?:carbunco|antrax|sangre (?:oscura|negra) por orificios|no coagula|muerte fulminante)/,
  /\b(?:rabia bovina|salivacion profusa|vaca caida|paralisis en vacas|timpanismo|vaca inflada|empaste)/,
  /\b(?:prolapso uterino|distocia|parto distocico|ternero atascado)/,
];

export function hasUrgency(messages: string[], mode: "mascotas" | "agro" = "mascotas") {
  return messages.some((message) => {
    const normalized = message.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/\s+/g, " ");
    const signals = mode === "agro" ? [...urgentSignals, ...agroUrgentSignals] : urgentSignals;
    return signals.some((signal) => signal.test(normalized));
  });
}

export function minimizePersonalData(message: string) {
  return message
    .replace(/https?:\/\/\S+|www\.\S+/gi, "[enlace omitido]")
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
    text: "Entiendo que te preocupe que no quiera comer. Observa cómo se encuentra hoy, si bebe agua con normalidad y contacta a una veterinaria si el cambio se mantiene o empeora.",
    question: "¿Desde cuándo ocurre? ¿Está bebiendo agua y se comporta como siempre?",
  };
}

export function emergencyReply(
  clinics: z.infer<typeof publicSuggestion>[] = [],
  mode: "mascotas" | "agro" = "mascotas"
): AssistantReply {
  if (mode === "agro") {
    const agroBaseText =
      "🚨 ALERTA ZOOSANITARIA INMEDIATA:\n" +
      "1. Aísla de inmediato al animal o lote afectado del resto del rebaño para prevenir contagios masivos.\n" +
      "2. Prohíbe la movilización de ganado o aves fuera del predio.\n" +
      "3. Desinfecta botas, mangas y vehículos en el ingreso al predio pecuario.\n" +
      "4. Notifica con urgencia a un médico veterinario especialista en animales mayores y reporta la sospecha ante el SENASA (Línea de emergencia pecuaria: 0800-10125 / Ica: 056-224435).";

    const text = clinics.length === 0
      ? `${agroBaseText}\n\nNo se registran clínicas pecuarias en el directorio en este momento. Coordina de inmediato con el puesto de control SENASA más cercano o un médico veterinario colegiado local.`
      : agroBaseText;

    return {
      source: "safety",
      urgent: true,
      clinics: clinics.slice(0, 3),
      question: null,
      text,
    };
  }

  const baseText = "Busca atención veterinaria inmediata. Llama a un establecimiento cercano o acude directamente. No esperes una respuesta del asistente ni la confirmación de una cita en línea.";
  const text = clinics.length === 0
    ? `${baseText}\n\nNo se encontraron clínicas veterinarias disponibles en el directorio en este momento. Por favor, busca atención veterinaria urgente de inmediato por otros medios locales (hospital veterinario o clínica de urgencias 24h más cercana).`
    : baseText;

  return {
    source: "safety",
    urgent: true,
    clinics: clinics.slice(0, 3),
    question: null,
    text,
  };
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
  none: null,
  animal: "¿Qué animal es y qué edad aproximada tiene?",
  onset: "¿Desde cuándo ocurre y con qué frecuencia?",
  change: "¿Ha cambiado su comportamiento habitual desde que empezó?",
};

export function renderGuidance(
  result: z.infer<typeof classification>,
  guidance?: ModelGuidance,
  clinics: z.infer<typeof publicSuggestion>[] = [],
  mode: "mascotas" | "agro" = "mascotas"
): AssistantReply {
  const selectedClinics = clinics.slice(0, 3);
  if (result.level === "urgent") return { ...emergencyReply(selectedClinics, mode), source: "assistant" };
  if (result.intent === "greeting") {
    const defaultText = mode === "agro"
      ? "¡Hola! 🌾 Soy VetIA Agro, tu asistente de orientación pecuaria y zoosanitaria. Te ayudo con dudas sobre bovinos, porcinos, ovinos, caprinos y aves, manejo preventivo, bioseguridad y triaje sanitario."
      : "¡Hola! 🐾 Soy VetIA, tu asistente de orientación veterinaria. Estoy aquí para ayudarte a cuidar de tu mascota y resolver dudas de salud o bienestar.";
    const defaultQuestion = mode === "agro"
      ? "¿De qué especie o lote pecuario deseas consultar hoy (bovino, cerdo, ovino, caprino o ave)?"
      : "¿En qué puedo ayudarte hoy con tu mascota?";
    return {
      source: "assistant",
      urgent: false,
      clinics: selectedClinics,
      question: defaultQuestion,
      text: guidance?.text ?? defaultText,
    };
  }
  if (result.intent === "thanks") {
    return {
      source: "assistant",
      urgent: false,
      clinics: selectedClinics,
      question: null,
      text: guidance?.text ?? (mode === "agro" ? "¡De nada! Recuerda vigilar periódicamente la condición corporal y bioseguridad de tu rebaño." : "¡De nada! Aquí estaré siempre que necesites orientarte sobre el cuidado de tu mascota."),
    };
  }
  if (result.intent === "capabilities") {
    return {
      source: "assistant",
      urgent: false,
      clinics: selectedClinics,
      question: "¿De qué especie deseas consultar?",
      text: guidance?.text ?? (mode === "agro"
        ? "En VetIA Agro puedo orientarte sobre manejo zootécnico de bovinos, porcinos, ovinos, caprinos y aves, detección temprana de alertas sanitarias, pautas de bioseguridad y conexión con veterinarios rurales o SENASA. No prescribo medicamentos ni dosis."
        : "Puedo orientarte sobre síntomas habituales, cuidados preventivos, nutrición y comportamiento en perros y gatos, además de avisarte cuándo acudir a una clínica veterinaria. No prescribo recetas ni sustituyo a un médico veterinario."),
    };
  }
  if (result.intent === "medication") {
    return {
      source: "assistant",
      urgent: false,
      clinics: selectedClinics,
      question: "¿Qué síntomas presenta?",
      text: guidance?.text ?? "No puedo indicar medicamentos ni dosis. Un veterinario debe recetar el tratamiento tras examinar al animal.",
    };
  }

  if (guidance) return { source: "assistant", urgent: false, clinics: selectedClinics, question: guidance.question, text: guidance.text };
  if (result.level === "clarify") {
    return {
      source: "assistant",
      urgent: false,
      clinics: selectedClinics,
      question: mode === "agro" ? "¿Desde cuándo notas el cambio en el lote? ¿Hay animales aislados o caídos?" : "¿Desde cuándo notas el cambio? ¿Está bebiendo agua y se comporta como siempre?",
      text: mode === "agro"
        ? "Para orientar mejor las medidas de manejo sanitario del predio, ¿podrías darme un poco más de contexto sobre los signos observados?"
        : "Entiendo tu preocupación. Para poder orientarte con mayor precisión sobre lo que le sucede a tu mascota, ¿podrías darme un poco más de contexto?",
    };
  }

  const recommendation = result.level === "general"
    ? "Si observas molestias, cambios persistentes o decaimiento, consulta con una clínica veterinaria."
    : "Te aconsejo contactar o acudir a una clínica veterinaria para una valoración presencial. Por chat no es posible descartar una afección mayor.";

  return {
    source: "assistant",
    urgent: false,
    clinics: selectedClinics,
    question: followUp[result.question],
    text: `${observation[result.topic]} ${recommendation}`,
  };
}
