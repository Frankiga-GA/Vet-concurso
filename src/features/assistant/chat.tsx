"use client";

import Link from "next/link";
import Script from "next/script";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { cities } from "@/features/appointments/contract";
import { assistantReply, maxContextMessages, maxMessageLength, type AssistantReply } from "./contract";
import { emergencyReply, hasUrgency, minimizePersonalData } from "./safety";

type Turnstile = {
  render(node: HTMLElement, options: {
    sitekey: string; action: string; callback: (token: string) => void;
    "expired-callback": () => void; "error-callback": () => void; size: "compact" | "flexible";
    "response-field": boolean;
  }): string;
  reset(id: string): void;
  remove(id: string): void;
};
type Turn = { id: number; message: string; reply: AssistantReply };

export function AssistantChat({ siteKey, challenge }: { siteKey: string; challenge: string }) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [message, setMessage] = useState("");
  const [city, setCity] = useState("");
  const [ready, setReady] = useState(false);
  const [token, setToken] = useState("");
  const [challengeError, setChallengeError] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const target = useRef<HTMLDivElement>(null);
  const widget = useRef<{ api: Turnstile; id: string } | null>(null);
  const sending = useRef(false);
  const counter = useRef(0);
  const urgent = hasUrgency([message]);
  const directory = city ? `/veterinarias?ciudad=${city}` : "/veterinarias";

  useEffect(() => {
    const api = (window as Window & { turnstile?: Turnstile }).turnstile;
    if (!ready || !api || !target.current) return;
    const id = api.render(target.current, {
      sitekey: siteKey, action: challenge,
      size: target.current.clientWidth < 300 ? "compact" : "flexible", "response-field": false,
      callback: (value) => { setToken(value); setChallengeError(false); },
      "expired-callback": () => setToken(""),
      "error-callback": () => { setToken(""); setChallengeError(true); },
    });
    widget.current = { api, id };
    return () => { api.remove(id); widget.current = null; };
  }, [ready, siteKey, challenge]);

  function append(text: string, reply: AssistantReply) {
    const id = ++counter.current;
    setTurns((previous) => [...previous, { id, message: text, reply }].slice(-maxContextMessages));
    setMessage("");
  }

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = minimizePersonalData(message.trim()).slice(0, maxMessageLength);
    if (sending.current || text.length < 3) return;
    setError("");
    const messages = [...turns.map((turn) => turn.message), text].slice(-maxContextMessages);
    if (hasUrgency(messages)) { append(text, emergencyReply()); return; }
    if (!token) return;
    sending.current = true;
    setPending(true);
    try {
      const response = await fetch("/api/asistente", {
        method: "POST", headers: { "Content-Type": "application/json" },
        cache: "no-store", signal: AbortSignal.timeout(30000),
        body: JSON.stringify({ messages, city: city || null, token }),
      });
      const body = await response.json();
      const parsed = assistantReply.safeParse(body);
      if (response.ok && parsed.success) append(text, parsed.data);
      else setError(typeof body?.error === "string" ? body.error : "No pudimos consultar el asistente.");
    } catch {
      setError("No pudimos consultar el asistente. Puedes contactar a una veterinaria desde el directorio.");
    } finally {
      setToken("");
      widget.current?.api.reset(widget.current.id);
      sending.current = false;
      setPending(false);
    }
  }

  return <>
    <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" onReady={() => setReady(true)} onError={() => setChallengeError(true)} />
    <section aria-label="Conversación" aria-live="polite" className="space-y-3">
      {turns.length === 0 && <p className="vet-card">Cuéntanos qué animal es, qué observas y desde cuándo.</p>}
      {turns.map(({ id, message: text, reply }) => <div key={id} className="space-y-2 wrap-break-word">
        <p className="vet-notice vet-notice-info"><strong>Tú</strong><br />{text}</p>
        <div className={reply.urgent ? "vet-notice vet-notice-danger" : "vet-card"}>
          <p className="font-semibold">{reply.urgent ? "Atención inmediata" : "Orientación inicial"}</p>
          <p>{reply.text}</p>
          {reply.question && <p className="mt-2">{reply.question}</p>}
          {reply.clinics.length > 0 && <ul className="mt-3 space-y-2">
            {reply.clinics.map((clinic) => <li key={clinic.slug}>
              <Link className="font-semibold text-emerald-800 underline" href={`/veterinarias/${clinic.slug}`}>{clinic.name} · {clinic.city}</Link>
            </li>)}
          </ul>}
          <Link href={directory} className="mt-3 inline-block font-semibold underline">Consultar directorio de veterinarias</Link>
        </div>
      </div>)}
    </section>
    <form onSubmit={send} aria-busy={pending} className="space-y-3 vet-card">
      <fieldset disabled={pending} className="grid min-w-0 gap-3">
        <label className="font-medium">Ciudad para buscar veterinarias
          <select value={city} onChange={(event) => setCity(event.target.value)} className="vet-field">
            <option value="">Seleccionar ciudad (opcional)</option>
            {cities.map((name) => <option key={name}>{name}</option>)}
          </select>
        </label>
        <label className="font-medium">Tu consulta
          <textarea value={message} onChange={(event) => setMessage(event.target.value)}
            required minLength={3} maxLength={maxMessageLength} rows={4} className="vet-field" />
        </label>
      </fieldset>
      {urgent && <p role="alert" className="font-semibold text-rose-900">{emergencyReply().text} <Link href={directory} className="underline">Ver directorio</Link></p>}
      <div ref={target} className="max-w-full" />
      {challengeError && <p role="alert" className="text-sm text-rose-800">No se pudo cargar la verificación de seguridad. Recarga la página o usa el directorio.</p>}
      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={pending || (!token && !urgent)} className="vet-button vet-button-primary">
          {pending ? "Consultando…" : "Enviar consulta"}
        </button>
        <button type="button" disabled={pending} onClick={() => { setTurns([]); setMessage(""); setError(""); }}
          className="vet-button vet-button-secondary">Reiniciar conversación</button>
      </div>
      {error && <p role="alert" className="text-sm text-rose-800">{error}</p>}
    </form>
  </>;
}
