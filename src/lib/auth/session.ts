import "server-only";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function requireUser() {
  let supabase;
  try {
    supabase = await createSupabaseServerClient();
  } catch {
    redirect("/auth/login?error=unconfigured");
  }
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect("/auth/login");
  if (!user.email_confirmed_at) redirect("/auth/check-email");
  return { supabase, user };
}

export async function requirePlatformAdmin() {
  const { supabase, user } = await requireUser();
  const { data: isAdmin, error } = await supabase.rpc("vetia_is_platform_admin");
  if (error || !isAdmin) redirect("/account");
  const { data: assurance } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  return { supabase, user, isAdmin: true, aal2: assurance?.currentLevel === "aal2" };
}
