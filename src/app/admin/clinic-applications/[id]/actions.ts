"use server";

import { revalidatePath } from "next/cache";
import { requirePlatformAdminAal2 } from "@/lib/auth/session";
import { adminApplicationsPath } from "@/features/clinic-applications/admin-query";
import {
  decisionError, decisionInput, decisionReceipt, decisionStatuses, unconfirmedDecision, type DecisionResult,
} from "@/features/clinic-applications/decision-contract";
import { adminDecisionsEnabled } from "@/features/clinic-applications/decision-feature";

export async function submitAdministrativeDecision(input: unknown): Promise<DecisionResult> {
  if (!adminDecisionsEnabled()) {
    return { ok: false, message: "Disponible después de validar seguridad." };
  }

  const parsed = decisionInput.safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const field = issue.path[0];
    return { ok: false, message: field === "visibleMessage" || field === "internalNotes"
      ? (issue.code === "invalid_type" ? "Revisa el mensaje y las notas." : issue.message)
      : "Los datos de revisión no son válidos. Recarga el detalle y vuelve a intentarlo." };
  }

  const { supabase } = await requirePlatformAdminAal2();
  const { applicationId, operationId, expectedReviewedAt, action, visibleMessage, internalNotes } = parsed.data;
  try {
    const { data, error } = await supabase.rpc("vetia_review_clinic_application", {
      p_application_id: applicationId,
      p_operation_id: operationId,
      p_expected_reviewed_at: expectedReviewedAt,
      p_action: action,
      p_visible_message: visibleMessage || null,
      p_internal_notes: internalNotes || null,
    });
    if (error) return decisionError(error);

    const receipt = decisionReceipt.safeParse(data);
    if (!receipt.success || receipt.data.application_id !== applicationId
      || receipt.data.status !== decisionStatuses[action]
      || (receipt.data.clinic_id !== null) !== (action === "approve")) {
      return unconfirmedDecision;
    }

    revalidatePath(adminApplicationsPath);
    revalidatePath(`${adminApplicationsPath}/${applicationId}`);
    revalidatePath("/account/clinic-applications");
    return { ok: true, receipt: receipt.data };
  } catch {
    return unconfirmedDecision;
  }
}
