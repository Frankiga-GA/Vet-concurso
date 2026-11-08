import "server-only";

import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";

const operationalClinic = z.object({ clinic_id: z.uuid(), name: z.string(), role: z.enum(["clinic_admin", "clinic_staff"]) });

export async function requireClinicMembership(clinicId: string) {
  if (!z.uuid().safeParse(clinicId).success) notFound();
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase.rpc("vetia_my_operational_clinics", { p_clinic_id: clinicId }).maybeSingle();
  const membership = operationalClinic.safeParse(data);
  if (error) throw new Error("No se pudo comprobar el acceso a la clínica.");
  if (!membership.success || membership.data.clinic_id !== clinicId) notFound();
  return { supabase, user, membership: membership.data };
}

export async function requireAnyClinicMembership() {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase.rpc("vetia_my_operational_clinics", { p_clinic_id: null });
  const memberships = z.array(operationalClinic).safeParse(data);
  if (error || !memberships.success) redirect("/auth/login?error=unavailable");
  return { supabase, user, memberships: memberships.data };
}
