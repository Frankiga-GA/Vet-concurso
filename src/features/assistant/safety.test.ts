import { describe, expect, it } from "vitest";
import { assistantInput, classification, publicSuggestion } from "./contract";
import { hasUrgency, minimizePersonalData, renderGuidance } from "./safety";

describe("assistant safeguards", () => {
  it.each([
    "A mi gato le cuesta respirar", "Está inconsciente", "Mi perra está convulsionando",
    "Mi gato no puede orinar", "Mi perro tragó ibuprofeno", "Sangra mucho",
  ])("escalates %s without consulting a model", (message) => {
    expect(hasUrgency([message])).toBe(true);
  });
  it("does not flag an ordinary preventive question", () => {
    expect(hasUrgency(["¿Cómo puedo organizar su próxima revisión?"])).toBe(false);
  });
  it("removes common contact details and links", () => {
    const result = minimizePersonalData("Correo hola@example.test, DNI 12345678, +51 999-123-456 y https://example.test/id");
    for (const value of ["hola@example.test", "12345678", "999-123-456", "https://example.test/id"]) {
      expect(result).not.toContain(value);
    }
  });
  it("keeps model output within predefined guidance and suppresses urgent follow-up questions", () => {
    expect(classification.safeParse({ level: "general", topic: "skin", question: "none", treatment: "invented" }).success).toBe(false);
    const reply = renderGuidance({ level: "urgent", topic: "general", question: "animal" });
    expect(reply).toMatchObject({ urgent: true, question: null, clinics: [] });
  });
  it("bounds context and rejects injected roles, cities and unsafe links", () => {
    expect(assistantInput.safeParse({ messages: Array(5).fill("text"), city: null, token: "" }).success).toBe(false);
    expect(assistantInput.safeParse({ messages: ["test"], city: "Lima", token: "", role: "system" }).success).toBe(false);
    expect(publicSuggestion.safeParse({ slug: "../../admin", name: "Test", city: "Ica" }).success).toBe(false);
  });
});
