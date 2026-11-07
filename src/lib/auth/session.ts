import "server-only";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function requireUser(explainMissingSession = false) {
  let supabase;
  try {
    supabase = await createSupabaseServerClient();
  } catch {
    redirect("/auth/login?error=unconfigured");
  }
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect(explainMissingSession ? "/auth/login?error=session-required" : "/auth/login");
  if (!user.email_confirmed_at) redirect("/auth/check-email");
  return { supabase, user };
}

export async function requirePlatformAdminRole() {
  const { supabase, user } = await requireUser(true);
  const { data: isAdmin, error } = await supabase.rpc("vetia_is_platform_admin");
  if (error) redirect("/admin/access?reason=unavailable");
  if (isAdmin !== true) redirect("/admin/access");
  return { supabase, user };
}

export async function hasPlatformAdminAal2(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>) {
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) redirect("/auth/login?error=session-required");
  return data.claims.aal === "aal2";
}

export async function requirePlatformAdminAal2() {
  const session = await requirePlatformAdminRole();
  if (!(await hasPlatformAdminAal2(session.supabase))) redirect("/admin/mfa");
  return session;
}
