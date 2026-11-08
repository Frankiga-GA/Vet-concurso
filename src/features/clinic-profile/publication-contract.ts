import { z } from "zod";
import { profileSnapshot } from "./contract";

const revision = z.number().int().min(0).max(2147483646);
export const publicationReview = profileSnapshot.extend({
  clinicId: z.uuid(),
  lifecycle: z.enum(["pending_activation", "active", "suspended", "inactive"]),
  publicationRevision: revision,
  complete: z.boolean(),
});
export const publicationInput = z.strictObject({
  clinicId: z.uuid(),
  profileRevision: revision,
  publicationRevision: revision,
  operationId: z.uuid(),
  decision: z.enum(["publish", "withdraw"]),
  reason: z.string().trim().min(5).max(500)
    .refine((reason) => !/\p{Cc}/u.test(reason.replaceAll("\n", ""))),
});
export const publicationReceipt = z.object({
  receiptId: z.uuid(),
  publication: z.enum(["published", "withdrawn"]),
  publicationRevision: z.number().int().positive(),
});
export type PublicationReview = z.infer<typeof publicationReview>;
export type PublicationInput = z.infer<typeof publicationInput>;
export type PublicationResult = { ok: boolean; message: string };

export function availablePublicationDecision(profile: PublicationReview) {
  if (profile.publication === "published") return "withdraw";
  return profile.complete && profile.lifecycle === "active" ? "publish" : null;
}

export function publicationError(code?: string, message?: string): PublicationResult {
  if (code === "PT401" || code === "PGRST301" || code === "PGRST303") {
    return { ok: false, message: "La sesión caducó. Inicia sesión y verifica TOTP." };
  }
  if (code === "42501") return { ok: false, message: message === "Recent TOTP verification required"
    ? "Verifica tu autenticador TOTP nuevamente y reintenta."
    : "Tu sesión o tus permisos no permiten esta decisión." };
  if (code === "PT409") return { ok: false, message: message === "Applicant representation is not valid for publication"
    ? "La acreditación del representante debe ser válida y estar vigente."
    : message === "Authorized clinic activation is required"
      ? "La clínica necesita una activación administrativa registrada."
      : "La revisión cambió o la clínica no cumple las condiciones. Actualiza el detalle." };
  return { ok: false, message: "No se pudo confirmar el resultado. Revisa el estado antes de reintentar." };
}

export async function publicationRetrySlot(userId: string, draft: Omit<PublicationInput, "operationId">) {
  const fingerprint = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify([
    userId, draft.clinicId, draft.profileRevision, draft.publicationRevision, draft.decision, draft.reason.trim(),
  ])));
  return "vetia:clinic-publication:" + Array.from(new Uint8Array(fingerprint), (byte) => byte.toString(16).padStart(2, "0")).join("");
}
