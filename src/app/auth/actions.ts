"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const newAccountCredentials = z.object({
  email: z.email().max(254),
  password: z.string().min(10).max(128),
});
const registrationDetails = newAccountCredentials.extend({
  firstName: z.string().trim().min(2).max(80),
  lastName: z.string().trim().min(2).max(120),
});
// Only Auth can determine whether an existing password is valid. The current
// minimum applies when setting a password, not when verifying an old one.
const loginCredentials = newAccountCredentials.extend({ password: z.string().min(1).max(128) });

function readCredentials(formData: FormData, schema: typeof newAccountCredentials) {
  return schema.safeParse({
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
    password: String(formData.get("password") ?? ""),
  });
}

export async function registerAction(formData: FormData) {
  const parsed = registrationDetails.safeParse({
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
    password: String(formData.get("password") ?? ""),
    firstName: String(formData.get("firstName") ?? "").trim(),
    lastName: String(formData.get("lastName") ?? "").trim(),
  });
  if (!parsed.success) redirect("/auth/register?error=invalid");

  let supabase;
  try { supabase = await createSupabaseServerClient(); }
  catch { redirect("/auth/register?error=unconfigured"); }

  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/auth/callback`,
      data: { first_name: parsed.data.firstName, last_name: parsed.data.lastName },
    },
  });
  if (error) redirect("/auth/register?error=signup");
  redirect("/auth/check-email");
}

export async function loginAction(formData: FormData) {
  const parsed = readCredentials(formData, loginCredentials);
  if (!parsed.success) redirect("/auth/login?error=invalid");

  let supabase;
  try { supabase = await createSupabaseServerClient(); }
  catch { redirect("/auth/login?error=unconfigured"); }

  const { data: signIn, error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error || !signIn.user) redirect("/auth/login?error=credentials");
  const { data: isAdmin } = await supabase.rpc("vetia_is_platform_admin");
  if (isAdmin) {
    const { data: assurance } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    redirect(assurance?.currentLevel === "aal2" ? "/admin" : "/admin/mfa");
  }
  const { data: memberships } = await supabase.rpc("vetia_my_operational_clinics", { p_clinic_id: null }).limit(1);
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

export async function signInWithGoogleAction(returnTo: string = "/auth/login") {
  let supabase;
  try { supabase = await createSupabaseServerClient(); }
  catch { redirect(`${returnTo}?error=unconfigured`); }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${siteUrl}/auth/callback`,
      queryParams: {
        access_type: "offline",
        prompt: "select_account",
      },
    },
  });

  if (error || !data?.url) {
    redirect(`${returnTo}?error=oauth`);
  }

  redirect(data.url);
}

export async function loginWithGoogleAction() {
  await signInWithGoogleAction("/auth/login");
}

export async function registerWithGoogleAction() {
  await signInWithGoogleAction("/auth/register");
}
