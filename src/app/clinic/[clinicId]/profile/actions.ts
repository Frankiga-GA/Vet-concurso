"use server";

import { z } from "zod";
import { requireClinicMembership } from "@/lib/auth/clinic";
import { fieldLabels, profileInput, profileSnapshot, type ProfileResult } from "@/features/clinic-profile/contract";

export async function saveClinicProfile(clinicId: string, previous: ProfileResult, form: FormData): Promise<ProfileResult> {
  const fail = (message: string, invalid?: ProfileResult["invalid"]) => ({ profile: previous.profile, message, invalid });
  if (!z.uuid().safeParse(clinicId).success) return fail("Clínica no disponible.");
  const { supabase, membership } = await requireClinicMembership(clinicId);
  if (membership.role !== "clinic_admin") return fail("Tu cuenta no puede editar este perfil.");
  const value = (key: string) => String(form.get(key) ?? "").trim();
  let hours: unknown;
  try {
    hours = JSON.parse(value("hours"));
  } catch {
    return fail("Revisa el formato de los horarios.", "hours");
  }
  const revision = value("revision");
  const result = profileInput.safeParse({
    revision: /^\d+$/.test(revision) ? Number(revision) : NaN,
    name: value("name"), address: value("address") || null, city: value("city"),
    phone: value("phone") || null, description: value("description").replaceAll("\r\n", "\n") || null,
    services: value("services").split(/\r?\n/).map((line) => line.trim()).filter(Boolean),
    hours,
  });
  if (!result.success) {
    const key = result.error.issues[0]?.path[0];
    if (typeof key === "string" && Object.hasOwn(fieldLabels, key)) {
      const invalid = key as keyof typeof fieldLabels;
      return fail(invalid === "hours" ? "Revisa los turnos. Usa HH:MM y evita solapamientos."
        : `Revisa el campo «${fieldLabels[invalid]}».`, invalid);
    }
    return fail("Recarga la página para recuperar la revisión del perfil.");
  }

  const profile = result.data;
  try {
    const { data, error } = await supabase.rpc("vetia_save_clinic_profile", {
      p_clinic_id: clinicId, p_revision: profile.revision, p_name: profile.name, p_address: profile.address,
      p_city: profile.city, p_phone: profile.phone, p_description: profile.description,
      p_services: profile.services, p_hours: profile.hours,
    });
    if (error?.code === "PT409") return fail("El perfil cambió o fue publicado. Recarga antes de volver a guardar.");
    if (error?.code === "42501") return fail("Tu cuenta ya no puede editar este perfil.");
    if (error?.code === "22023") return fail("Revisa los datos y horarios antes de guardar.");
    const saved = profileSnapshot.safeParse(data);
    if (!error && saved.success) {
      return { profile: saved.data, message: saved.data.missing.length ? "Borrador guardado." : "Perfil completo guardado." };
    }
  } catch {
    // A reload shows the last committed revision if the response was lost.
  }
  return fail("No pudimos comprobar el guardado. Recarga la página antes de volver a intentarlo.");
}
