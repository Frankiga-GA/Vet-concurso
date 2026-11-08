import { z } from "zod";

export const activationInput = z.strictObject({
  clinicId: z.uuid(),
  expectedReviewedAt: z.iso.datetime({ offset: true }),
  operationId: z.uuid(),
});

export const activationReceipt = z.object({
  receipt_id: z.uuid(),
  clinic_id: z.uuid(),
  activated_at: z.iso.datetime({ offset: true }),
  lifecycle_status: z.literal("active"),
  membership_status: z.literal("active"),
});

export type ActivationInput = z.infer<typeof activationInput>;
export type ActivationResult = { ok: boolean; message: string };

export function activationError(code?: string, message?: string): ActivationResult {
  if (code === "PT401" || code === "PGRST301" || code === "PGRST303") {
    return { ok: false, message: "La sesión caducó. Inicia sesión y verifica tu autenticador." };
  }
  if (code === "42501") return { ok: false, message: message === "Recent TOTP verification required"
    ? "Verifica tu autenticador TOTP nuevamente y reintenta."
    : "Tu sesión no tiene permiso para activar esta clínica." };
  if (code === "PT409" && message === "Applicant representation is not valid for activation") {
    return { ok: false, message: "La acreditación del representante debe estar vigente para activar la clínica." };
  }
  if (code === "PT409" || code === "P0002") {
    return { ok: false, message: "La revisión cambió o la clínica no está lista para activarse. Actualiza el detalle." };
  }
  return { ok: false, message: "No pudimos confirmar la activación. Revisa el estado o reintenta con la misma solicitud." };
}
