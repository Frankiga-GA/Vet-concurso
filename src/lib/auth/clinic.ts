import "server-only";

import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";

export async function requireClinicMembership(clinicId: string) {
  const { supabase, user } = await requireUser();
  const { data: membership, error } = await supabase.from("clinic_memberships")
    .select("clinic_id, user_id, role, status")
    .eq("clinic_id", clinicId)
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();
  if (error || !membership) notFound();
  return { supabase, user, membership };
}

export async function requireAnyClinicMembership() {
  const { supabase, user } = await requireUser();
  const { data: memberships, error } = await supabase.from("clinic_memberships")
    .select("clinic_id, role")
    .eq("user_id", user.id)
    .eq("status", "active");
  if (error) redirect("/auth/login?error=unavailable");
  return { supabase, user, memberships: memberships ?? [] };
}
