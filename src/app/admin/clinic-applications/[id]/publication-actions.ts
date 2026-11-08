"use server";

import { revalidatePath } from "next/cache";
import { requirePlatformAdminAal2 } from "@/lib/auth/session";
import { clinicPublicationEnabled } from "@/features/clinic-profile/publication-feature";
import { publicationError, publicationInput, publicationReceipt, type PublicationResult } from "@/features/clinic-profile/publication-contract";

export async function submitClinicPublication(input: unknown): Promise<PublicationResult> {
  if (!clinicPublicationEnabled()) return { ok: false, message: "La publicación administrativa está deshabilitada." };
  const parsed = publicationInput.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Indica un motivo válido y vuelve a intentar." };
  const { supabase } = await requirePlatformAdminAal2();
  const { clinicId, profileRevision, publicationRevision, operationId, decision, reason } = parsed.data;
  try {
    const { data, error } = await supabase.rpc(decision === "publish" ? "vetia_publish_clinic" : "vetia_withdraw_clinic", {
      p_clinic_id: clinicId, p_profile_revision: profileRevision, p_publication_revision: publicationRevision,
      p_operation_id: operationId, p_reason: reason,
    });
    if (error) return publicationError(error.code, error.message);
    const receipt = publicationReceipt.safeParse(data);
    if (!receipt.success || receipt.data.publication !== (decision === "publish" ? "published" : "withdrawn")
      || receipt.data.publicationRevision !== publicationRevision + 1) return publicationError();
    revalidatePath("/admin/clinic-applications/[id]", "page");
    revalidatePath("/veterinarias");
    revalidatePath("/veterinarias/[slug]", "page");
    return { ok: true, message: decision === "publish" ? "Clínica publicada." : "Clínica retirada del directorio." };
  } catch {
    return publicationError();
  }
}
