"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { parseApplication, submissionKeySchema } from "@/features/clinic-applications/submission";

export async function submitClinicApplication(data: FormData) {
  const { supabase } = await requireUser();
  const application = parseApplication(data);
  if (!application.success) return { ok: false as const, message: application.error.issues[0].message };
  const key = submissionKeySchema.safeParse(data.get("submissionKey"));
  if (!key.success) return { ok: false as const, message: "No pudimos preparar el envío. Recarga la página e inténtalo de nuevo." };

  const { data: id, error } = await supabase.rpc("vetia_submit_clinic_application_v2", {
    p_submission_key: key.data,
    p_business_name: application.data.businessName,
    p_legal_name: application.data.legalName,
    p_ruc: application.data.ruc,
    p_city: application.data.city,
    p_address: application.data.address,
    p_contact_name: application.data.contactName,
    p_contact_email: application.data.contactEmail,
    p_contact_phone: application.data.contactPhone,
    p_legal_representative_name: application.data.legalRepresentativeName,
    p_legal_representative_document: application.data.legalRepresentativeDocument,
    p_veterinarian_name: application.data.veterinarianName,
    p_veterinarian_license: application.data.veterinarianLicense,
    p_services: application.data.services,
    p_opening_hours: application.data.openingHours,
  });

  if (error) {
    if (error.code === "23505" || error.message?.includes("RUC")) {
      return {
        ok: false as const,
        message: "Ya existe una solicitud activa o una clínica aprobada con este RUC. No se permiten solicitudes duplicadas.",
      };
    }
    return { ok: false as const, message: error.message || "No pudimos confirmar el envío. Puedes volver a intentarlo con los mismos datos." };
  }

  if (!id) {
    return { ok: false as const, message: "No pudimos confirmar el envío. Puedes volver a intentarlo con los mismos datos." };
  }

  revalidatePath("/account/clinic-applications");
  return {
    ok: true as const,
    message: "Tu solicitud de incorporación fue recibida con éxito. Recuerda que no otorga acceso inmediato ni publica la clínica: adjunta ahora tus documentos de sustento para la verificación por superadministrador.",
  };
}

export async function completeClinicApplicationDetails(formData: FormData) {
  const { supabase } = await requireUser();
  const applicationId = z.uuid().safeParse(formData.get("applicationId"));
  const legalName = String(formData.get("legalName") ?? "").trim();
  const ruc = String(formData.get("ruc") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const legalRepresentativeName = String(formData.get("legalRepresentativeName") ?? "").trim();
  const legalRepresentativeDocument = String(formData.get("legalRepresentativeDocument") ?? "").trim();
  const veterinarianName = String(formData.get("veterinarianName") ?? "").trim();
  const veterinarianLicense = String(formData.get("veterinarianLicense") ?? "").trim();

  if (!applicationId.success) {
    return { ok: false as const, message: "Identificador no válido." };
  }

  const { error } = await supabase.rpc("vetia_complete_clinic_application", {
    p_application_id: applicationId.data,
    p_legal_name: legalName,
    p_ruc: ruc,
    p_address: address,
    p_legal_representative_name: legalRepresentativeName,
    p_legal_representative_document: legalRepresentativeDocument,
    p_veterinarian_name: veterinarianName,
    p_veterinarian_license: veterinarianLicense,
  });

  if (error) {
    if (error.code === "23505" || error.message?.includes("RUC")) {
      return {
        ok: false as const,
        message: "Ya existe una solicitud activa o aprobada con este RUC.",
      };
    }
    return { ok: false as const, message: error.message || "No se pudieron guardar los datos." };
  }

  revalidatePath("/account/clinic-applications");
  revalidatePath(`/admin/clinic-applications/${applicationId.data}`);
  return { ok: true as const, message: "Datos del establecimiento completados y actualizados." };
}
