"use server";

import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { parseLimaTime, requestFields, type AppointmentResult } from "@/features/appointments/contract";
import { intakeConfig, verifyIntakeToken } from "@/features/appointments/intake-security";

export async function requestAppointment(_previous: AppointmentResult, form: FormData): Promise<AppointmentResult> {
  const config = intakeConfig();
  if (!config) return { message: "El envío de citas no está disponible en este momento." };
  const data = requestFields.safeParse(Object.fromEntries(form));
  if (form.get("website") !== "") {
    return { message: "Revisa el nombre, teléfono, motivo, horario y verificación antes de enviar." };
  }
  if (!data.success) {
    const { name, phone, reason } = z.flattenError(data.error).fieldErrors;
    return { message: "Revisa los datos ingresados e inténtalo nuevamente.", fields: {
      name: name && "Escribe un nombre de entre 2 y 120 caracteres.",
      phone: phone && "Ingresa un teléfono válido, con entre 6 y 15 dígitos.",
      reason: reason && "Describe el motivo en entre 5 y 500 caracteres.",
    } };
  }
  const preferred = parseLimaTime(data.data.preferred);
  if (!preferred) return { message: "Revisa el horario preferido.", fields: {
    preferred: "Elige una fecha y hora futura dentro de los próximos 90 días.",
  } };
  if (!verifyIntakeToken(config.intakeKey, data.data.clinicId, data.data.token)) {
    return { message: "No se pudo verificar el envío de la solicitud. Por favor, completa el formulario con calma e inténtalo nuevamente." };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data: reference, error } = await supabase.rpc("vetia_request_appointment", {
      p_intake_key: config.intakeKey,
      p_request_key: data.data.requestKey,
      p_clinic_id: data.data.clinicId,
      p_contact_name: data.data.name,
      p_contact_phone: data.data.phone,
      p_reason: data.data.reason,
      p_preferred_at: preferred,
    });
    if (error?.code === "PT429") return { message: "Se alcanzó el límite de solicitudes. Intenta más tarde." };
    if (error?.code === "PT409") return { message: "La solicitud no se pudo enviar. Verifica la clínica o recarga antes de iniciar otra solicitud." };
    if (!error && z.uuid().safeParse(reference).success) {
      return { message: "Solicitud recibida. La clínica te contactará para acordar el horario.", reference };
    }
  } catch {
    // A transport error can occur after commit. Keep the same request key in the form.
  }
  return { message: "No se pudo confirmar el envío. Reintenta con los mismos datos." };
}
