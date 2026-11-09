"use client";

import { useRef, useState, useTransition, type FormEvent } from "react";
import { saveMyProfile } from "@/app/account/profile/actions";

export function ProfileForm({ profile }: { profile: { first_name: string | null; last_name: string | null; phone: string | null; city: string | null } | null }) {
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const sending = useRef(false);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending.current || pending) return;
    sending.current = true; setResult(null);
    const data = new FormData(event.currentTarget);
    startTransition(async () => {
      try { setResult(await saveMyProfile(data)); }
      catch { setResult({ ok: false, message: "No pudimos confirmar el guardado. Inténtalo nuevamente." }); }
      finally { sending.current = false; }
    });
  }
  return <form onSubmit={submit} aria-busy={pending} className="mt-5 space-y-4">
    <fieldset disabled={pending} className="grid gap-4 sm:grid-cols-2">
      <label className="block text-sm font-medium">Nombres<input className="vet-field" name="firstName" autoComplete="given-name" required minLength={2} maxLength={80} defaultValue={profile?.first_name ?? ""} /></label>
      <label className="block text-sm font-medium">Apellidos<input className="vet-field" name="lastName" autoComplete="family-name" required minLength={2} maxLength={120} defaultValue={profile?.last_name ?? ""} /></label>
      <label className="block text-sm font-medium">Teléfono (opcional)<input className="vet-field" name="phone" type="tel" autoComplete="tel" maxLength={32} defaultValue={profile?.phone ?? ""} /></label>
      <label className="block text-sm font-medium">Ciudad<select className="vet-field" name="city" required defaultValue={profile?.city ?? ""}><option value="" disabled>Selecciona una ciudad</option><option>Chincha</option><option>Pisco</option><option>Ica</option></select></label>
    </fieldset>
    <button className="vet-button vet-button-primary" type="submit">{pending ? "Guardando…" : "Guardar perfil"}</button>
    {result && <p role={result.ok ? "status" : "alert"} className={`vet-notice text-sm ${result.ok ? "vet-notice-info" : "vet-notice-danger"}`}>{result.message}</p>}
  </form>;
}
