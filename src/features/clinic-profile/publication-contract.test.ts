import { describe, expect, it } from "vitest";
import { availablePublicationDecision, publicationError, publicationInput, publicationRetrySlot, type PublicationReview } from "./publication-contract";

const clinicId = "80f52b8e-9740-4fb9-9d3e-f215452e7d47";
const operationId = "c2af0104-cc0e-4e5d-aa5f-b613b98ba09a";
const draft = { clinicId, profileRevision: 1, publicationRevision: 0, decision: "publish" as const, reason: "Datos revisados" };
const profile: PublicationReview = {
  clinicId, publicationRevision: 0, revision: 1, lifecycle: "active", publication: "unpublished", complete: true,
  name: "Clínica", city: "Ica", address: "Dirección", phone: "999123456", description: "Atención veterinaria",
  services: ["Consulta"], hours: [{ day: 1, start: "09:00", end: "17:00" }], missing: [],
};

describe("publication controls", () => {
  it("shows publication only for active and complete profiles", () => {
    expect(availablePublicationDecision(profile)).toBe("publish");
    expect(availablePublicationDecision({ ...profile, complete: false })).toBeNull();
    expect(availablePublicationDecision({ ...profile, lifecycle: "suspended" })).toBeNull();
  });

  it("allows withdrawal of a published profile even if eligibility was lost", () => {
    expect(availablePublicationDecision({ ...profile, publication: "published", complete: false })).toBe("withdraw");
  });

  it("accepts only valid IDs, revisions, actions and reason", () => {
    expect(publicationInput.safeParse({ ...draft, operationId }).success).toBe(true);
    expect(publicationInput.safeParse({ ...draft, operationId, clinicId: "other" }).success).toBe(false);
    expect(publicationInput.safeParse({ ...draft, operationId, publicationRevision: -1 }).success).toBe(false);
    expect(publicationInput.safeParse({ ...draft, operationId, decision: "activate" }).success).toBe(false);
    expect(publicationInput.safeParse({ ...draft, operationId, reason: "  " }).success).toBe(false);
  });

  it("reuses the same retry slot and binds it to actor, payload and revisions", async () => {
    const slot = await publicationRetrySlot("operator", draft);
    expect(await publicationRetrySlot("operator", { ...draft, reason: " Datos revisados " })).toBe(slot);
    expect(await publicationRetrySlot("other", draft)).not.toBe(slot);
    expect(await publicationRetrySlot("operator", { ...draft, publicationRevision: 1 })).not.toBe(slot);
    expect(slot).not.toContain(draft.reason);
  });

  it("maps MFA and accreditation failures and hides unknown details", () => {
    expect(publicationError("42501", "Recent TOTP verification required").message).toMatch(/TOTP/);
    expect(publicationError("PT409", "Applicant representation is not valid for publication").message).toMatch(/acreditación/);
    expect(publicationError("XX000", "private table").message).not.toContain("private table");
  });
});
