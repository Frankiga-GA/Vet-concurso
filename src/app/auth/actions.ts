"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const credentialsSchema = z.object({
  email: z.email().max(254),
  password: z.string().min(10).max(128),
});

function readCredentials(formData: FormData) {
  return credentialsSchema.safeParse({
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
    password: String(formData.get("password") ?? ""),
  });
}

export async function registerAction(formData: FormData) {
  const parsed = readCredentials(formData);
  if (!parsed.success) redirect("/auth/register?error=invalid");

  let supabase;
  try { supabase = await createSupabaseServerClient(); }
  catch { redirect("/auth/register?error=unconfigured"); }

  const { error } = await supabase.auth.signUp({
    ...parsed.data,
    options: { emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/auth/callback` },
  });
  if (error) redirect("/auth/register?error=signup");
  redirect("/auth/check-email");
}

export async function loginAction(formData: FormData) {
  const parsed = readCredentials(formData);
  if (!parsed.success) redirect("/auth/login?error=invalid");

  let supabase;
  try { supabase = await createSupabaseServerClient(); }
  catch { redirect("/auth/login?error=unconfigured"); }

  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) redirect("/auth/login?error=credentials");
  const { data: isAdmin } = await supabase.rpc("vetia_is_platform_admin");
  if (isAdmin) {
    const { data: assurance } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    redirect(assurance?.currentLevel === "aal2" ? "/admin" : "/admin/mfa");
  }
  const { data: memberships } = await supabase.from("clinic_memberships")
    .select("clinic_id").eq("user_id", (await supabase.auth.getUser()).data.user?.id ?? "")
    .eq("status", "active").limit(1);
  if (memberships?.length) redirect("/clinic");
  redirect("/account");
}

export async function resetPasswordAction(formData: FormData) {
  const email = z.email().safeParse(String(formData.get("email") ?? "").trim().toLowerCase());
  if (!email.success) redirect("/auth/forgot-password?error=invalid");

  let supabase;
  try { supabase = await createSupabaseServerClient(); }
  catch { redirect("/auth/forgot-password?error=unconfigured"); }

  await supabase.auth.resetPasswordForEmail(email.data, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/auth/callback?next=/auth/update-password`,
  });
  // Neutral response prevents account enumeration.
  redirect("/auth/check-email?purpose=recovery");
}

export async function updatePasswordAction(formData: FormData) {
  const password = z.string().min(10).max(128).safeParse(String(formData.get("password") ?? ""));
  if (!password.success) redirect("/auth/update-password?error=invalid");
  let supabase;
  try { supabase = await createSupabaseServerClient(); }
  catch { redirect("/auth/update-password?error=unconfigured"); }
  const { error } = await supabase.auth.updateUser({ password: password.data });
  if (error) redirect("/auth/update-password?error=expired");
  redirect("/account?notice=password-updated");
}

export async function logoutAction() {
  let supabase;
  try { supabase = await createSupabaseServerClient(); }
  catch { redirect("/auth/login"); }
  await supabase.auth.signOut();
  redirect("/");
}
