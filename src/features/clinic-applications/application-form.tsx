"use client";

import { useRef, useState, useTransition, type FormEvent } from "react";
import { submitClinicApplication } from "@/app/account/clinic-applications/actions";
import { cities, createSubmissionKeys, parseApplication, submissionSlot } from "./submission";

const inputClass = "mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2";

export function ApplicationForm({ userId }: { userId: string }) {
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const sending = useRef(false);
  const keys = useRef<ReturnType<typeof createSubmissionKeys> | null>(null);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending.current || pending) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const application = parseApplication(data);
    if (!application.success) {
      setResult({ ok: false, message: application.error.issues[0].message });
      return;
    }

    if (!keys.current) {
      let storage: Storage | undefined;
      try { storage = window.sessionStorage; } catch { /* Storage may be unavailable. */ }
      keys.current = createSubmissionKeys(storage);
    }
    const submissionKeys = keys.current;
    sending.current = true;
    setResult(null);
    startTransition(async () => {
      try {
        const slot = await submissionSlot(userId, application.data);
        data.set("submissionKey", submissionKeys.get(slot));
        const response = await submitClinicApplication(data);
        if (response.ok) {
          form.reset();
          submissionKeys.complete(slot);
        }
        setResult(response);
      } catch {
        setResult({ ok: false, message: "No pudimos confirmar el envío. Revisa tus solicitudes o vuelve a intentarlo con los mismos datos." });
      } finally {
        sending.current = false;
      }
    });
  }

  return <form method="post" onSubmit={submit} aria-busy={pending} className="mt-5">
    <fieldset disabled={pending} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium">
          Nombre comercial
          <input className={inputClass} name="businessName" autoComplete="organization" required minLength={2} maxLength={180} />
        </label>
        <label className="block text-sm font-medium">
          Ciudad
          <select className={inputClass} name="city" defaultValue="" required>
            <option value="" disabled>Selecciona una ciudad</option>
            {cities.map((city) => <option key={city}>{city}</option>)}
          </select>
        </label>
        <label className="block text-sm font-medium">
          Nombre de contacto
          <input className={inputClass} name="contactName" autoComplete="name" required minLength={2} maxLength={120} />
        </label>
        <label className="block text-sm font-medium">
          Correo de contacto
          <input className={inputClass} name="contactEmail" type="email" autoComplete="email" required maxLength={254} />
        </label>
        <label className="block text-sm font-medium">
          Teléfono de contacto
          <input className={inputClass} name="contactPhone" type="tel" autoComplete="tel" required minLength={6} maxLength={32} />
        </label>
      </div>
      <button type="submit" className="rounded-full bg-emerald-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-900 disabled:opacity-60">
        {pending ? "Enviando…" : "Enviar solicitud"}
      </button>
    </fieldset>
    {result && <p role={result.ok ? "status" : "alert"} className={`mt-3 text-sm ${result.ok ? "text-emerald-800" : "text-red-800"}`}>
      {result.message}
    </p>}
  </form>;
}
