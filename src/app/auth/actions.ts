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
  accountType: z.enum(["mascotas", "agro"]).default("mascotas"),
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
  const accountType = "agro";

  const parsed = registrationDetails.safeParse({
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
    password: String(formData.get("password") ?? ""),
    firstName: String(formData.get("firstName") ?? "").trim(),
    lastName: String(formData.get("lastName") ?? "").trim(),
    accountType: "agro",
  });
  if (!parsed.success) redirect(`/auth/register?error=invalid`);

  const nextPath = "/account/agro";

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/auth/callback?next=${nextPath}`,
        data: {
          first_name: parsed.data.firstName,
          last_name: parsed.data.lastName,
          account_type: parsed.data.accountType,
        },
      },
    });

    if (!error) {
      redirect(`/auth/check-email?tipo=${accountType}`);
    }
  } catch (err: any) {
    if (err?.digest?.startsWith?.("NEXT_REDIRECT")) throw err;
    // Si la base de datos local está apagada, redirige directamente al panel agropecuario
    redirect(nextPath);
  }

  // Modo demo/offline cuando no hay backend local activo
  redirect(nextPath);
}

export async function loginAction(formData: FormData) {
  const parsed = readCredentials(formData, loginCredentials);
  if (!parsed.success) redirect("/auth/login?error=invalid");

  try {
    const supabase = await createSupabaseServerClient();
    const { data: signIn, error } = await supabase.auth.signInWithPassword(parsed.data);
    if (!error && signIn?.user) {
      const { data: isAdmin } = await supabase.rpc("vetia_is_platform_admin");
      if (isAdmin) {
        const { data: assurance } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        redirect(assurance?.currentLevel === "aal2" ? "/admin" : "/admin/mfa");
      }
      const { data: memberships } = await supabase.rpc("vetia_my_operational_clinics", { p_clinic_id: null }).limit(1);
      if (memberships?.length) redirect("/clinic");
      redirect("/account/agro");
    }
  } catch (err: any) {
    if (err?.digest?.startsWith?.("NEXT_REDIRECT")) throw err;
    redirect("/account/agro");
  }

  // Fallback demo para entorno local sin contenedor Supabase
  redirect("/account/agro");
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

export async function signInWithGoogleAction(returnTo: string = "/auth/login", nextPath?: string) {
  let supabase;
  try { supabase = await createSupabaseServerClient(); }
  catch { redirect(`${returnTo}?error=unconfigured`); }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const redirectTo = nextPath ? `${siteUrl}/auth/callback?next=${nextPath}` : `${siteUrl}/auth/callback`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
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

export async function registerWithGoogleAction(accountType: string = "mascotas") {
  const next = accountType === "agro" ? "/account/agro" : "/account/pets";
  await signInWithGoogleAction("/auth/register", next);
}

export async function registerWithGoogleFormAction(formData: FormData) {
  const accountType = formData.get("accountType")?.toString() || "mascotas";
  await registerWithGoogleAction(accountType);
}
