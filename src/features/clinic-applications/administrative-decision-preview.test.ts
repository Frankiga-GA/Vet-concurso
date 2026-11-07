import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AdministrativeDecisionPreview } from "./administrative-decision-preview";
import { decisionRetrySlot, type DecisionDraft } from "./decision-contract";
import { createSubmissionKeys } from "./submission";

const statuses = ["submitted", "needs_information", "approved", "rejected"] as const;

describe("administrative decision preview", () => {
  it.each(statuses)("provides no write controls for a %s application", (status) => {
    const html = renderToStaticMarkup(createElement(AdministrativeDecisionPreview, { status }));
    const buttons = [...html.matchAll(/<button\b[^>]*>/g)].map(([tag]) => tag);

    expect(buttons).toHaveLength(3);
    for (const button of buttons) {
      expect(button).toContain('type="button"');
      expect(button).toMatch(/\sdisabled=""/);
    }
    expect(html.match(/Disponible después de validar seguridad/g)).toHaveLength(3);
    expect(html).not.toMatch(/<(?:form|a|input|script)\b|\s(?:action|formaction|form|href|name|on\w+)=/i);
  });

  it("renders editable draft fields and the approval prerequisites", () => {
    const html = renderToStaticMarkup(createElement(AdministrativeDecisionPreview, { status: "submitted" }));
    for (const action of ["Aprobar", "Rechazar", "Solicitar información"]) {
      expect(html).toContain(`>${action}</summary>`);
    }
    expect(html.match(/<textarea\b/g)).toHaveLength(6);
    expect(html.match(/<textarea\b[^>]*\srequired=""/g)).toHaveLength(2);
    expect(html).toContain("acreditación vigente del representante");
    expect(html).toContain("verificación TOTP en los últimos diez minutos");
    expect(html).toContain("clínica pendiente de activación");
    expect(html).toContain("membresía administrativa pendiente");
    expect(html).toContain("La veterinaria seguirá sin publicar");
  });

  it("offers confirmation only for transitions available from needs_information", () => {
    const html = renderToStaticMarkup(createElement(AdministrativeDecisionPreview, {
      status: "needs_information",
      review: { userId: "admin", applicationId: "application", expectedReviewedAt: null },
      submitDecisionAction: async () => ({ ok: false as const, message: "Test" }),
    }));
    expect(html).toContain("Confirmar: aprobar");
    expect(html).toContain("Confirmar: rechazar");
    expect(html).not.toContain("Confirmar: solicitar información");
  });

  it("keeps the same key across retries and isolates changed drafts and users", async () => {
    const draft: DecisionDraft = {
      applicationId: "application", expectedReviewedAt: null, action: "reject",
      visibleMessage: " Motivo ", internalNotes: "nota privada",
    };
    const first = await decisionRetrySlot("admin", draft);
    const retry = await decisionRetrySlot("admin", { ...draft, visibleMessage: "Motivo" });
    const keys = createSubmissionKeys(undefined);
    expect(keys.get(first)).toBe(keys.get(retry));
    expect(await decisionRetrySlot("admin", { ...draft, internalNotes: "otra nota" })).not.toBe(first);
    expect(await decisionRetrySlot("other-admin", draft)).not.toBe(first);
    expect(first).not.toContain(draft.internalNotes);
  });
});
