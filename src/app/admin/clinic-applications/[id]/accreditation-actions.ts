"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePlatformAdminAal2 } from "@/lib/auth/session";
import { adminApplicationsPath } from "@/features/clinic-applications/admin-query";

function toFriendlyAccreditationError(error: { code?: string; message?: string }) {
  const msg = error.message || "";
  if (msg.includes("clinic_applications_decision_consistency") || msg.includes("violates check constraint")) {
    return "No se pudo actualizar el estado de la solicitud debido a restricciones de consistencia en el expediente.";
  }
  if (msg.includes("Self-accreditation is not allowed") || error.code === "42501") {
    return "Por seguridad, no puedes acreditar tu propia solicitud de veterinaria.";
  }
  if (
    msg.includes("No se puede marcar SUNAT") ||
    msg.includes("No se puede marcar CMVP") ||
    msg.includes("No se puede marcar SUNARP") ||
    msg.includes("Application does not exist")
  ) {
    return msg; // Mensajes limpios definidos en las funciones de la base de datos
  }
  if (error.code === "PT401" || error.code === "PGRST303" || error.code === "PGRST301") {
    return "Tu sesión administrativa ya no está vigente. Vuelve a iniciar sesión y verifica TOTP.";
  }
  if (error.code === "22023") {
    return "Los datos de comprobación no cumplen los requisitos mínimos exigidos.";
  }
  if (error.code === "23514") {
    return "La operación no cumple con las reglas de validación del expediente.";
  }
  return "No se pudo completar la operación de acreditación. Recarga la página y vuelve a intentarlo.";
}

const saveChecksSchema = z.object({
  applicationId: z.uuid(),
  sunatVerified: z.boolean(),
  sunatStatus: z.enum(["activo_habido", "activo_no_habido", "no_hallado", "baja", "invalido"]).nullable(),
  sunatNotes: z.string().max(1000).nullable(),
  sunarpRequired: z.boolean(),
  sunarpVerified: z.boolean(),
  sunarpEntry: z.string().max(200).nullable(),
  sunarpNotes: z.string().max(1000).nullable(),
  cmvpVerified: z.boolean(),
  cmvpLicenseStatus: z.enum(["habilitado", "no_habilitado", "no_encontrado"]).nullable(),
  cmvpNotes: z.string().max(1000).nullable(),
});

export async function saveAccreditationChecksAction(formData: FormData) {
  const { supabase } = await requirePlatformAdminAal2();
  const parsed = saveChecksSchema.safeParse({
    applicationId: formData.get("applicationId"),
    sunatVerified: formData.get("sunatVerified") === "true",
    sunatStatus: formData.get("sunatStatus") || null,
    sunatNotes: formData.get("sunatNotes") || null,
    sunarpRequired: formData.get("sunarpRequired") === "true",
    sunarpVerified: formData.get("sunarpVerified") === "true",
    sunarpEntry: formData.get("sunarpEntry") || null,
    sunarpNotes: formData.get("sunarpNotes") || null,
    cmvpVerified: formData.get("cmvpVerified") === "true",
    cmvpLicenseStatus: formData.get("cmvpLicenseStatus") || null,
    cmvpNotes: formData.get("cmvpNotes") || null,
  });

  if (!parsed.success) {
    return { ok: false as const, message: "Datos de comprobación no válidos." };
  }

  const { error } = await supabase.rpc("vetia_save_accreditation_checks", {
    p_application_id: parsed.data.applicationId,
    p_sunat_verified: parsed.data.sunatVerified,
    p_sunat_status: parsed.data.sunatStatus,
    p_sunat_notes: parsed.data.sunatNotes,
    p_sunarp_required: parsed.data.sunarpRequired,
    p_sunarp_verified: parsed.data.sunarpVerified,
    p_sunarp_entry: parsed.data.sunarpEntry,
    p_sunarp_notes: parsed.data.sunarpNotes,
    p_cmvp_verified: parsed.data.cmvpVerified,
    p_cmvp_license_status: parsed.data.cmvpLicenseStatus,
    p_cmvp_notes: parsed.data.cmvpNotes,
  });

  if (error) {
    return { ok: false as const, message: toFriendlyAccreditationError(error) };
  }

  revalidatePath(`${adminApplicationsPath}/${parsed.data.applicationId}`);
  return { ok: true as const, message: "Comprobaciones guardadas correctamente." };
}

export async function requestAccreditationCorrectionsAction(formData: FormData) {
  const { supabase } = await requirePlatformAdminAal2();
  const applicationId = z.uuid().safeParse(formData.get("applicationId"));
  const notes = String(formData.get("correctionNotes") ?? "").trim();

  if (!applicationId.success || notes.length < 5) {
    return { ok: false as const, message: "Ingresa el detalle de las correcciones (mínimo 5 caracteres)." };
  }

  const { error } = await supabase.rpc("vetia_request_accreditation_corrections", {
    p_application_id: applicationId.data,
    p_notes: notes,
  });

  if (error) {
    return { ok: false as const, message: toFriendlyAccreditationError(error) };
  }

  revalidatePath(adminApplicationsPath);
  revalidatePath(`${adminApplicationsPath}/${applicationId.data}`);
  revalidatePath("/account/clinic-applications");
  return { ok: true as const, message: "Correcciones solicitadas. La solicitud quedó en espera de subsanación del solicitante." };
}

export async function verifyAccreditationAction(formData: FormData) {
  const { supabase } = await requirePlatformAdminAal2();
  const applicationId = z.uuid().safeParse(formData.get("applicationId"));
  const evidenceReference = String(formData.get("evidenceReference") ?? "").trim();

  if (!applicationId.success) {
    return { ok: false as const, message: "Identificador de solicitud no válido." };
  }

  const { error } = await supabase.rpc("vetia_verify_clinic_accreditation", {
    p_application_id: applicationId.data,
    p_evidence_reference: evidenceReference || null,
  });

  if (error) {
    return { ok: false as const, message: toFriendlyAccreditationError(error) };
  }

  revalidatePath(adminApplicationsPath);
  revalidatePath(`${adminApplicationsPath}/${applicationId.data}`);
  return { ok: true as const, message: "Acreditación marcada como verificada con éxito." };
}
