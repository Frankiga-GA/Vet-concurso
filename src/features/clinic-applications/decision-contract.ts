import { z } from "zod";

export const decisionStatuses = {
  approve: "approved",
  reject: "rejected",
  request_information: "needs_information",
} as const;

export type DecisionAction = keyof typeof decisionStatuses;

export const reviewTimestamp = z.iso.datetime({ offset: true });

export const decisionInput = z.object({
  applicationId: z.uuid(),
  operationId: z.uuid(),
  expectedReviewedAt: reviewTimestamp.nullable(),
  action: z.enum(["approve", "reject", "request_information"]),
  visibleMessage: z.string().trim().max(2000, "El mensaje admite hasta 2000 caracteres."),
  internalNotes: z.string().trim().max(4000, "Las notas admiten hasta 4000 caracteres."),
}).refine((input) => input.action === "approve" || input.visibleMessage.length > 0, {
  path: ["visibleMessage"], message: "Escribe un mensaje para el solicitante.",
});

export type DecisionDraft = Omit<z.input<typeof decisionInput>, "operationId">;

export const decisionReceipt = z.object({
  application_id: z.uuid(),
  review_id: z.uuid(),
  status: z.enum(["approved", "rejected", "needs_information"]),
  clinic_id: z.uuid().nullable(),
  reviewed_at: reviewTimestamp,
});

export type DecisionResult =
  | { ok: true; receipt: z.infer<typeof decisionReceipt> }
  | { ok: false; message: string };

export const unconfirmedDecision: DecisionResult = {
  ok: false,
  message: "No pudimos confirmar el resultado. Revisa el estado o reintenta con los mismos datos.",
};

export function decisionError(error: { code?: string; message?: string }): DecisionResult {
  if (error.code === "PT401" || error.code === "PGRST303" || error.code === "PGRST301") {
    return { ok: false, message: "Tu sesión administrativa ya no está vigente. Vuelve a iniciar sesión y verifica TOTP." };
  }
  if (error.code === "42501") {
    if (error.message === "Recent TOTP verification required") {
      return { ok: false, message: "Para aprobar, vuelve a iniciar sesión y verifica TOTP. La verificación debe tener menos de diez minutos." };
    }
    if (error.message === "Self-review is not allowed") {
      return { ok: false, message: "No puedes decidir sobre tu propia solicitud." };
    }
    return { ok: false, message: "Tu sesión no tiene autorización para registrar esta decisión. Comprueba tu acceso administrativo y MFA." };
  }
  if (error.code === "PT409") {
    if (error.message === "Applicant representation has not been verified") {
      return { ok: false, message: "La aprobación requiere una acreditación vigente del representante. Verifica la evidencia y registra la acreditación mediante el procedimiento autorizado antes de reintentar." };
    }
    if (error.message === "Review operation key already used with different input") {
      return { ok: false, message: "El intento ya corresponde a otra decisión. Recarga el detalle y revisa el estado de la solicitud." };
    }
    return { ok: false, message: "La solicitud cambió o ya no admite esa decisión. Recarga el detalle antes de continuar." };
  }
  if (error.code === "P0002") return { ok: false, message: "La solicitud ya no está disponible." };
  if (error.code === "22023") return { ok: false, message: "Revisa los datos de la decisión antes de enviarla." };
  return unconfirmedDecision;
}

export async function decisionRetrySlot(userId: string, draft: DecisionDraft) {
  // Keep only a digest and the UUID in sessionStorage, never the note or message.
  const identity = JSON.stringify([
    userId, draft.applicationId, draft.expectedReviewedAt, draft.action,
    draft.visibleMessage.trim(), draft.internalNotes.trim(),
  ]);
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(identity));
  return "vetia:admin-decision:" + Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}
