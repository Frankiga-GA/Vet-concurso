"use client";

import Script from "next/script";
import { useActionState, useEffect, useRef, useState } from "react";
import { requestAppointment } from "@/app/veterinarias/actions";

type Turnstile = {
  render(node: HTMLElement, options: {
    sitekey: string; action: string; callback: (token: string) => void;
    "expired-callback": () => void; "error-callback": () => void; size: "flexible";
    "response-field": boolean;
  }): string;
  reset(id: string): void;
  remove(id: string): void;
};

const input = "mt-1 w-full rounded-xl border border-slate-300 bg-white p-3 text-base";

export function RequestForm({ clinicId, requestKey, siteKey, challengeAction }: {
  clinicId: string; requestKey: string; siteKey: string; challengeAction: string;
}) {
  const [result, action, pending] = useActionState(requestAppointment, { message: "" });
  const [ready, setReady] = useState(false);
  const [token, setToken] = useState("");
  const [challengeError, setChallengeError] = useState(false);
  const [draft, setDraft] = useState({ name: "", phone: "", reason: "", preferred: "" });
  const container = useRef<HTMLDivElement>(null);
  const widget = useRef<{ api: Turnstile; id: string } | null>(null);

  useEffect(() => {
    const api = (window as Window & { turnstile?: Turnstile }).turnstile;
    if (!ready || !api || !container.current || result.reference) return;
    const id = api.render(container.current, {
      sitekey: siteKey, action: challengeAction, size: "flexible", "response-field": false,
      callback: (value) => { setToken(value); setChallengeError(false); },
      "expired-callback": () => setToken(""),
      "error-callback": () => { setToken(""); setChallengeError(true); },
    });
    widget.current = { api, id };
    return () => { api.remove(id); widget.current = null; };
  }, [ready, siteKey, challengeAction, result.reference]);

  useEffect(() => {
    if (result.message && !result.reference && widget.current) {
      const { api, id } = widget.current;
      api.reset(id);
    }
  }, [result]);

  if (result.reference) return <div role="status" className="mt-4 rounded-xl bg-emerald-50 p-4 text-emerald-950">
    <p>{result.message}</p>
    <p className="mt-2 break-all font-semibold">Referencia: {result.reference}</p>
    <p className="mt-2 text-sm">Guarda la referencia. La solicitud todavía no es una cita confirmada.</p>
  </div>;

  return <form action={action} className="mt-4 space-y-4" aria-busy={pending}>
    <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" onReady={() => setReady(true)} onError={() => setChallengeError(true)} />
    <input type="hidden" name="clinicId" value={clinicId} />
    <input type="hidden" name="requestKey" value={requestKey} />
    <input type="hidden" name="token" value={token} />
    <div hidden><label>Sitio web<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
    <fieldset disabled={pending} className="min-w-0 space-y-4">
      <label className="block font-medium">Nombre de contacto
        <input className={input} name="name" autoComplete="name" minLength={2} maxLength={120} required value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
      </label>
      <label className="block font-medium">Teléfono
        <input className={input} name="phone" autoComplete="tel" type="tel" maxLength={32} required value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} />
      </label>
      <label className="block font-medium">Motivo
        <textarea className={input} name="reason" rows={3} minLength={5} maxLength={500} required value={draft.reason} onChange={(e) => setDraft({ ...draft, reason: e.target.value })} />
      </label>
      <label className="block font-medium">Horario preferido (hora de Perú)
        <input className={input} name="preferred" type="datetime-local" required value={draft.preferred} onChange={(e) => setDraft({ ...draft, preferred: e.target.value })} />
      </label>
    </fieldset>
    <p className="text-sm text-slate-600">El establecimiento recibirá tus datos para coordinar la cita. Si necesitas atención inmediata, llama directamente a la veterinaria.</p>
    <div ref={container} className="max-w-full" />
    {challengeError && <p role="alert" className="text-sm text-rose-800">No se pudo cargar la comprobación. Recarga la página para volver a intentarlo.</p>}
    <button type="submit" disabled={pending || !token} className="rounded-xl bg-emerald-800 px-5 py-3 font-semibold text-white disabled:opacity-60">
      {pending ? "Enviando…" : "Enviar solicitud"}
    </button>
    {result.message && <p role="alert" className="text-sm text-rose-800">{result.message}</p>}
  </form>;
}
