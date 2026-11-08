import "server-only";

import { notFound } from "next/navigation";
import { z } from "zod";
import { requireClinicMembership } from "@/lib/auth/clinic";

export async function requireClinicRecords(clinicId: string) {
  if (!z.uuid().safeParse(clinicId).success) notFound();
  const { supabase } = await requireClinicMembership(clinicId);
  const { data, error } = await supabase.rpc("vetia_can_manage_clinic_records", { p_clinic_id: clinicId });
  if (error || data !== true) notFound();
  return supabase;
}
