import { describe, expect, it } from "vitest";
import { assistantInput, classification, publicSuggestion } from "./contract";
import {
  appetiteFollowUp,
  appetiteGuidance,
  emergencyReply,
  hasUrgency,
  localConversationIntent,
  minimizePersonalData,
  renderGuidance,
} from "./safety";

describe("assistant safeguards", () => {
  it.each([
    "A mi gato le cuesta respirar",
    "Está inconsciente",
    "Mi perra está convulsionando",
    "Mi gato no puede orinar",
    "Mi perro tragó ibuprofeno",
    "Sangra mucho",
  ])("escalates %s without consulting a model", (message) => {
    expect(hasUrgency([message])).toBe(true);
  });

  it("does not flag an ordinary preventive question", () => {
    expect(hasUrgency(["¿Cómo puedo organizar su próxima revisión?"])).toBe(false);
  });

  it("removes common contact details and links", () => {
    const result = minimizePersonalData(
      "Correo hola@example.test, DNI 12345678, +51 999-123-456 y https://example.test/id"
    );
    for (const value of ["hola@example.test", "12345678", "999-123-456", "https://example.test/id"]) {
      expect(result).not.toContain(value);
    }
  });

  it("keeps model output within predefined guidance and suppresses urgent follow-up questions", () => {
    expect(
      classification.safeParse({
        intent: "general",
        level: "general",
        topic: "skin",
        question: "none",
        treatment: "invented",
      }).success
    ).toBe(false);
    const reply = renderGuidance({ intent: "symptom", level: "urgent", topic: "general", question: "animal" });
    expect(reply).toMatchObject({ urgent: true, question: null, clinics: [] });
  });

  it("renders safe conversational intents without diagnoses or doses", () => {
    expect(renderGuidance({ intent: "greeting", level: "general", topic: "general", question: "none" }).text).toContain(
      "Soy VetIA"
    );
    expect(
      renderGuidance({ intent: "medication", level: "consult", topic: "general", question: "animal" }).text
    ).toContain("No puedo indicar medicamentos ni dosis");
    expect(
      renderGuidance({ intent: "symptom", level: "clarify", topic: "general", question: "animal" }).question
    ).toContain("Desde cuándo");
  });

  it("uses already validated natural wording while retaining the local urgent override", () => {
    const reply = renderGuidance(
      { intent: "symptom", level: "clarify", topic: "general", question: "animal" },
      { text: "Entiendo que te preocupe.", question: "¿Desde cuándo ocurre?" }
    );
    expect(reply).toMatchObject({ text: "Entiendo que te preocupe.", question: "¿Desde cuándo ocurre?" });
    expect(
      renderGuidance({ intent: "symptom", level: "urgent", topic: "general", question: "none" }, { text: "unsafe", question: null }).text
    ).toContain("Busca atención");
  });

  it("recognizes local conversational intents before trusting an inconsistent model label", () => {
    expect(localConversationIntent("Hola")).toBe("greeting");
    expect(localConversationIntent("Gracias")).toBe("thanks");
    expect(localConversationIntent("¿Qué puedes hacer?")).toBe("capabilities");
    expect(localConversationIntent("¿Qué dosis le doy?")).toBe("medication");
    expect(localConversationIntent("Mi perro no quiere comer")).toBeNull();
  });

  it("uses a focused, safe follow-up for appetite changes", () => {
    expect(appetiteFollowUp("Mi perro no quiere comer")).toContain("bebiendo agua");
    expect(appetiteGuidance("Mi perro no quiere comer")?.text).toContain("contacta a una veterinaria");
    expect(appetiteFollowUp("¿Cómo cuido los dientes de mi gato?")).toBeNull();
  });

  it("bounds context and rejects injected roles, cities and unsafe links", () => {
    expect(assistantInput.safeParse({ messages: Array(5).fill("text"), city: null, token: "" }).success).toBe(false);
    expect(assistantInput.safeParse({ messages: ["test"], city: "Lima", token: "", role: "system" }).success).toBe(false);
    expect(publicSuggestion.safeParse({ slug: "../../admin", name: "Test", city: "Ica" }).success).toBe(false);
  });

  it("escalates livestock zoosanitary emergencies and SENASA alert signs", () => {
    expect(hasUrgency(["Sospecha de fiebre aftosa con vesiculas en la ubre"], "agro")).toBe(true);
    expect(hasUrgency(["Muerte masiva en galpón de aves con cresta morada"], "agro")).toBe(true);
    expect(hasUrgency(["Vaca con timpanismo severo y dificultad respiratoria"], "agro")).toBe(true);
    const reply = emergencyReply([], "agro");
    expect(reply.urgent).toBe(true);
    expect(reply.text).toContain("SENASA");
    expect(reply.text).toContain("Aísla de inmediato");
  });
});
