"use server";

import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { parseLimaTime, requestFields, type AppointmentResult } from "@/features/appointments/contract";
import { intakeConfig, verifyChallenge } from "@/features/appointments/intake-security";

export async function requestAppointment(_previous: AppointmentResult, form: FormData): Promise<AppointmentResult> {
  const config = intakeConfig();
  if (!config) return { message: "El envío de citas no está disponible en este momento." };
  const data = requestFields.safeParse(Object.fromEntries(form));
  if (!data.success || form.get("website") !== "") {
    return { message: "Revisa el nombre, teléfono, motivo, horario y verificación antes de enviar." };
  }
  const preferred = parseLimaTime(data.data.preferred);
  if (!preferred) return { message: "Elige una fecha y hora futura dentro de los próximos 90 días." };
  if (!(await verifyChallenge(config, data.data.token))) {
    return { message: "No se pudo verificar el envío. Completa de nuevo la comprobación e inténtalo." };
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
