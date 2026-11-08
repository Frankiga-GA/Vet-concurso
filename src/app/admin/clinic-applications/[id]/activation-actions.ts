"use server";

import { revalidatePath } from "next/cache";
import { requirePlatformAdminAal2 } from "@/lib/auth/session";
import { adminDecisionsEnabled } from "@/features/clinic-applications/decision-feature";
import { activationError, activationInput, activationReceipt, type ActivationResult } from "@/features/clinic-applications/activation-contract";

export async function activateClinic(input: unknown): Promise<ActivationResult> {
  if (!adminDecisionsEnabled()) return { ok: false, message: "La activación administrativa está deshabilitada." };
  const parsed = activationInput.safeParse(input);
  if (!parsed.success) return { ok: false, message: "No se pudo identificar la revisión. Actualiza el detalle." };
  const { supabase } = await requirePlatformAdminAal2();
  const { clinicId, expectedReviewedAt, operationId } = parsed.data;
  try {
    const { data, error } = await supabase.rpc("vetia_activate_clinic", {
      p_clinic_id: clinicId,
      p_expected_reviewed_at: expectedReviewedAt,
      p_operation_id: operationId,
    });
    if (error) return activationError(error.code, error.message);
    const receipt = activationReceipt.safeParse(data);
    if (!receipt.success || receipt.data.clinic_id !== clinicId) return activationError();
    revalidatePath("/admin/clinic-applications/[id]", "page");
    revalidatePath("/clinic");
    return { ok: true, message: "Clínica y membresía administrativa activadas. La publicación se realiza por separado." };
  } catch {
    return activationError();
  }
}
