"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { parseApplication, submissionKeySchema } from "@/features/clinic-applications/submission";

export async function submitClinicApplication(data: FormData) {
  const { supabase } = await requireUser();
  const application = parseApplication(data);
  if (!application.success) return { ok: false as const, message: application.error.issues[0].message };
  const key = submissionKeySchema.safeParse(data.get("submissionKey"));
  if (!key.success) return { ok: false as const, message: "No pudimos preparar el envío. Recarga la página e inténtalo de nuevo." };

  const { businessName, city, contactName, contactEmail, contactPhone } = application.data;
  const { data: id, error } = await supabase.rpc("vetia_submit_clinic_application", {
    p_submission_key: key.data,
    p_business_name: businessName,
    p_city: city,
    p_contact_name: contactName,
    p_contact_email: contactEmail,
    p_contact_phone: contactPhone,
  });
  if (error || !id) return { ok: false as const, message: "No pudimos confirmar el envío. Puedes volver a intentarlo con los mismos datos." };

  revalidatePath("/account/clinic-applications");
  return { ok: true as const, message: "Tu solicitud fue recibida. Puedes consultar su estado en esta página." };
}
