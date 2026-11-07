"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireClinicMembership } from "@/lib/auth/clinic";
import { parseLimaTime, type AppointmentResult } from "@/features/appointments/contract";

const confirmation = z.object({
  clinicId: z.uuid(), appointmentId: z.uuid(), agreed: z.string(), coordinated: z.literal("yes"),
});

export async function confirmAppointment(_previous: AppointmentResult, form: FormData): Promise<AppointmentResult> {
  const parsed = confirmation.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { message: "Indica el horario acordado y confirma que ya coordinaste con el propietario." };
  const { clinicId, appointmentId, agreed } = parsed.data;
  const agreedAt = parseLimaTime(agreed);
  if (!agreedAt) return { message: "Elige un horario futuro dentro de los próximos 90 días." };

  const { supabase } = await requireClinicMembership(clinicId);
  try {
    const { data: reference, error } = await supabase.rpc("vetia_confirm_appointment", {
      p_clinic_id: clinicId, p_appointment_id: appointmentId, p_agreed_at: agreedAt,
    });
    if (error?.code === "PT409") return { message: "La cita ya fue confirmada con otro horario. Recarga la bandeja." };
    if (error?.code === "42501" || error?.code === "P0002") return { message: "Esta solicitud ya no está disponible para tu cuenta." };
    if (!error && z.uuid().safeParse(reference).success) {
      revalidatePath(`/clinic/${clinicId}/appointments`);
      return { message: "Cita confirmada.", reference };
    }
  } catch {
    // The clinic can check the refreshed inbox or repeat the same agreed time.
  }
  return { message: "No pudimos comprobar la confirmación. Recarga la bandeja antes de intentarlo de nuevo." };
}
