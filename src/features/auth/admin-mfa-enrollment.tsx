"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type TotpSetup = { factorId: string; qrCode: string; secret: string };
type FactorView = { id: string; friendly_name?: string; factor_type: string; status: string };

export function AdminMfaEnrollment({ aal2, initialFactors = [] }: { aal2: boolean; initialFactors?: FactorView[] }) {
  const router = useRouter();
  const [setup, setSetup] = useState<TotpSetup | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [factors, setFactors] = useState<FactorView[]>(initialFactors);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function refreshFactors() {
    const { data, error: listError } = await createSupabaseBrowserClient().auth.mfa.listFactors();
    if (listError) throw listError;
    setFactors(data.all.map((factor) => ({ id: factor.id, friendly_name: factor.friendly_name, factor_type: factor.factor_type, status: factor.status })));
    return data;
  }

  async function startEnrollment(additional: boolean) {
    setBusy(true); setError(null);
    try {
      const supabase = createSupabaseBrowserClient();
      if (!additional) {
        const data = await refreshFactors();
        const verified = data.totp.find((factor) => factor.status === "verified");
        if (verified) { setFactorId(verified.id); return; }
        const pending = data.all.find((factor) => factor.factor_type === "totp" && factor.status === "unverified");
        if (pending) await supabase.auth.mfa.unenroll({ factorId: pending.id });
      }
      const { data, error: enrollError } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: `VetIA Superadmin ${factors.filter((factor) => factor.factor_type === "totp").length + 1}`,
      });
      if (enrollError) throw enrollError;
      setFactorId(data.id);
      setSetup({ factorId: data.id, qrCode: data.totp.qr_code, secret: data.totp.secret });
    } catch {
      setError("No se pudo preparar el autenticador. Intenta de nuevo o contacta al responsable del proyecto.");
    } finally { setBusy(false); }
  }

  async function verify(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!factorId || !/^\d{6,8}$/.test(code)) { setError("Ingresa el código vigente de tu aplicación autenticadora."); return; }
    setBusy(true); setError(null);
    try {
      const supabase = createSupabaseBrowserClient();
      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId });
      if (challengeError) throw challengeError;
      const { error: verifyError } = await supabase.auth.mfa.verify({ factorId, challengeId: challenge.id, code });
      if (verifyError) throw verifyError;
      await supabase.auth.refreshSession();
      if (aal2) {
        await refreshFactors(); setSetup(null); setFactorId(null); setCode("");
        return;
      }
      router.replace("/admin"); router.refresh();
    } catch {
      setError("No se pudo verificar el código. Comprueba la hora del dispositivo e inténtalo otra vez.");
    } finally { setBusy(false); }
  }

  async function removeFactor(id: string) {
    const count = factors.filter((factor) => factor.factor_type === "totp" && factor.status === "verified").length;
    if (count <= 1) { setError("No puedes retirar el único factor verificado de la cuenta administrativa."); return; }
    if (!window.confirm("¿Retirar este factor de autenticación?")) return;
    setBusy(true); setError(null);
    try {
      const { error: removeError } = await createSupabaseBrowserClient().auth.mfa.unenroll({ factorId: id });
      if (removeError) throw removeError;
      await refreshFactors();
    } catch {
      setError("No se pudo retirar el factor. Se requiere una sesión AAL2 vigente.");
    } finally { setBusy(false); }
  }

  const qrImage = setup && <div className="rounded-2xl border border-slate-200 p-4">
    {/* Supabase Auth returns a short-lived SVG data URI for the TOTP enrollment QR. */}
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={setup.qrCode} alt="Código QR de configuración TOTP" className="mx-auto h-48 w-48" />
    <p className="mt-3 break-all text-xs text-slate-600">Clave de configuración: <strong>{setup.secret}</strong></p>
    <form onSubmit={verify} className="mt-4 space-y-3">
      <label className="block text-sm font-medium">Código de un solo uso<input value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 8))} inputMode="numeric" autoComplete="one-time-code" required className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3" /></label>
      <button disabled={busy} className="rounded-xl bg-emerald-800 px-5 py-3 font-semibold text-white disabled:opacity-60">{busy ? "Verificando…" : "Verificar factor"}</button>
    </form>
  </div>;

  if (aal2) return <section className="mt-7 space-y-5">
    <div className="rounded-2xl bg-emerald-50 p-5"><p className="font-semibold text-emerald-900">Segundo factor verificado para esta sesión.</p><Link className="mt-3 inline-block font-semibold text-emerald-900 underline" href="/admin">Volver al panel</Link></div>
    <h2 className="text-lg font-semibold">Factores TOTP registrados</h2>
    <ul className="space-y-2">{factors.filter((factor) => factor.factor_type === "totp").map((factor) => <li key={factor.id} className="flex items-center justify-between rounded-xl border border-slate-200 p-3 text-sm">
      <span>{factor.friendly_name ?? "Autenticador"} · {factor.status === "verified" ? "verificado" : "pendiente"}</span>
      {factor.status === "verified" && factors.filter((item) => item.factor_type === "totp" && item.status === "verified").length > 1 && <button type="button" disabled={busy} onClick={() => void removeFactor(factor.id)} className="font-semibold text-rose-700">Retirar</button>}
    </li>)}</ul>
    {!setup && <button type="button" disabled={busy} onClick={() => void startEnrollment(true)} className="rounded-xl border border-emerald-800 px-4 py-2 font-semibold text-emerald-900">Agregar otro autenticador</button>}
    {qrImage}
    {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
  </section>;

  return <section className="mt-7 space-y-5">
    <p className="text-sm leading-6 text-slate-600">El panel de superadministración requiere TOTP y una sesión AAL2. Configura una aplicación autenticadora.</p>
    {!factorId && <button type="button" disabled={busy} onClick={() => void startEnrollment(false)} className="rounded-xl bg-emerald-800 px-5 py-3 font-semibold text-white disabled:opacity-60">{busy ? "Preparando…" : "Configurar autenticador"}</button>}
    {qrImage}
    {factorId && !setup && <form onSubmit={verify} className="space-y-3">
      <label className="block text-sm font-medium">Código de un solo uso<input value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 8))} inputMode="numeric" autoComplete="one-time-code" required className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3" /></label>
      <button disabled={busy} className="rounded-xl bg-emerald-800 px-5 py-3 font-semibold text-white disabled:opacity-60">{busy ? "Verificando…" : "Verificar y activar"}</button>
    </form>}
    {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
  </section>;
}
