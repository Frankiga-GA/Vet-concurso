"use client";

import Link from "next/link";
import Script from "next/script";
import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { cities } from "@/features/appointments/contract";
import { assistantReply, maxContextMessages, maxMessageLength, type AssistantReply } from "./contract";
import { emergencyReply, hasUrgency, minimizePersonalData } from "./safety";

type Turnstile = { render(node: HTMLElement, options: { sitekey: string; action: string; callback: (token: string) => void; "expired-callback": () => void; "error-callback": () => void; size: "compact" | "flexible"; "response-field": boolean }): string; reset(id: string): void; remove(id: string): void };
type Turn = { id: number; message: string; reply?: AssistantReply; failed?: boolean };
const genericError = "No pudimos consultar el asistente. Puedes buscar una veterinaria en el directorio.";

export function AssistantChat({ siteKey, challenge }: { siteKey: string; challenge: string }) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [message, setMessage] = useState("");
  const [city, setCity] = useState("");
  const [ready, setReady] = useState(false);
  const [token, setToken] = useState("");
  const [challengeError, setChallengeError] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [failedTurnId, setFailedTurnId] = useState<number>();
  const target = useRef<HTMLDivElement>(null);
  const conversation = useRef<HTMLElement>(null);
  const form = useRef<HTMLFormElement>(null);
  const widget = useRef<{ api: Turnstile; id: string } | null>(null);
  const sending = useRef(false);
  const counter = useRef(0);
  const stickToLatest = useRef(true);
  const draftUrgent = hasUrgency([message]);
  const currentFailed = turns.find((turn) => turn.id === failedTurnId);

  useEffect(() => {
    const api = (window as Window & { turnstile?: Turnstile }).turnstile;
    if (!ready || !api || !target.current) return;
    const id = api.render(target.current, {
      sitekey: siteKey,
      action: challenge,
      // Flexible lets Cloudflare render its required test/verification text
      // within the widget instead of squeezing it into the compact variant.
      size: "flexible",
      "response-field": false,
      callback: (value) => { setToken(value); setChallengeError(false); },
      "expired-callback": () => setToken(""),
      "error-callback": () => { setToken(""); setChallengeError(true); },
    });
    widget.current = { api, id };
    return () => { api.remove(id); widget.current = null; };
  }, [ready, siteKey, challenge]);

  useEffect(() => {
    if (stickToLatest.current) conversation.current?.scrollTo({ top: conversation.current.scrollHeight, behavior: "smooth" });
  }, [turns, pending]);

  function resetChallenge() { setToken(""); widget.current?.api.reset(widget.current.id); }
  function updateTurn(id: number, change: Partial<Turn>) { setTurns((previous) => previous.map((turn) => turn.id === id ? { ...turn, ...change } : turn)); }

  async function requestReply(turn: Turn, messages: string[]) {
    if (sending.current || !token) return;
    sending.current = true;
    stickToLatest.current = true;
    setPending(true);
    setError("");
    setFailedTurnId(undefined);
    updateTurn(turn.id, { failed: false });
    try {
      const response = await fetch("/api/asistente", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        signal: AbortSignal.timeout(30000),
        body: JSON.stringify({ messages, city: city || null, token }),
      });
      const body = await response.json().catch(() => null);
      const parsed = assistantReply.safeParse(body);
      if (response.ok && parsed.success) updateTurn(turn.id, { reply: parsed.data });
      else {
        updateTurn(turn.id, { failed: true });
        setFailedTurnId(turn.id);
        setError(typeof body?.error === "string" ? body.error : genericError);
      }
    } catch {
      updateTurn(turn.id, { failed: true });
      setFailedTurnId(turn.id);
      setError(genericError);
    } finally {
      resetChallenge();
      sending.current = false;
      setPending(false);
    }
  }

  function startTurn(text: string) {
    const turn = { id: ++counter.current, message: text };
    const messages = [...turns.map((item) => item.message), text].slice(-maxContextMessages);
    stickToLatest.current = true;
    setTurns((previous) => [...previous, turn].slice(-maxContextMessages));
    setMessage("");
    return { turn, messages };
  }

  function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = minimizePersonalData(message.trim()).slice(0, maxMessageLength);
    if (sending.current || currentFailed || text.length < 3) return;
    const { turn, messages } = startTurn(text);
    if (hasUrgency(messages)) { updateTurn(turn.id, { reply: emergencyReply() }); return; }
    if (!token) {
      setTurns((previous) => previous.filter((item) => item.id !== turn.id));
      setError("Completa la verificación de seguridad para enviar tu consulta.");
      return;
    }
    void requestReply(turn, messages);
  }

  function retry() {
    if (currentFailed && token && !pending) void requestReply(currentFailed, turns.map((turn) => turn.message).slice(-maxContextMessages));
  }

  function keyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      form.current?.requestSubmit();
    }
  }

  function newConversation() {
    counter.current = 0;
    stickToLatest.current = true;
    setTurns([]);
    setMessage("");
    setError("");
    setFailedTurnId(undefined);
    resetChallenge();
  }

  return <section className="vet-chat" aria-label="Asistente VetIA">
    <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" onReady={() => setReady(true)} onError={() => setChallengeError(true)} />
    <header className="vet-chat-header">
      <div className="vet-chat-brand"><span className="vet-chat-avatar" aria-hidden="true">✦</span><div><h2>VetIA</h2><p>Orientación inicial para tu mascota</p></div></div>
      <div className="vet-chat-header-actions"><Link href="/veterinarias" className="vet-chat-directory">Directorio</Link><button type="button" className="vet-button vet-button-ghost vet-chat-new" onClick={newConversation} disabled={pending}>Nueva conversación</button></div>
    </header>
    <section ref={conversation} aria-label="Conversación" aria-live="polite" onScroll={(event) => { const element = event.currentTarget; stickToLatest.current = element.scrollHeight - element.scrollTop - element.clientHeight < 48; }} className="vet-chat-body">
      {turns.length === 0 && <div className="vet-chat-welcome"><span className="vet-chat-avatar vet-chat-avatar-large" aria-hidden="true">✦</span><h3>Hola, soy VetIA</h3><p>Describe lo que le ocurre a tu mascota con tus propias palabras. Si hay una urgencia, te orientaré para actuar de inmediato.</p><div className="vet-chat-prompts" aria-label="Ejemplos de consulta"><button type="button" onClick={() => setMessage("Mi perro no quiere comer")}>Mi perro no quiere comer</button><button type="button" onClick={() => setMessage("¿Cómo cuido los dientes de mi gato?")}>Cuidado dental de mi gato</button></div></div>}
      {turns.map((turn) => <div key={turn.id} className="vet-chat-turn">
        <div className="vet-chat-message vet-chat-message-user"><span className="sr-only">Tú: </span><p>{turn.message}</p></div>
        {turn.reply && <div className={turn.reply.urgent ? "vet-chat-message vet-chat-message-emergency" : "vet-chat-message vet-chat-message-assistant"}>
          <span className="vet-chat-avatar" aria-hidden="true">✦</span><div><p className="vet-chat-speaker">{turn.reply.urgent ? "Atención inmediata" : "VetIA"}</p><p>{turn.reply.text}</p>{turn.reply.question && <p className="vet-chat-question">{turn.reply.question}</p>}
          {turn.reply.clinics.length > 0 && <ul className="vet-chat-suggestions" aria-label="Veterinarias sugeridas">{turn.reply.clinics.map((clinic) => <li key={clinic.slug}><Link href={`/veterinarias/${clinic.slug}`}>{clinic.name}<span>{clinic.city}</span></Link></li>)}</ul>}</div>
        </div>}
        {turn.failed && <div className="vet-chat-message vet-chat-message-error" role="alert"><span className="vet-chat-avatar" aria-hidden="true">!</span><div><p className="vet-chat-speaker">No se pudo responder</p><p>{error || genericError}</p><button type="button" className="vet-link" disabled={pending || !token} onClick={retry}>Reintentar esta consulta</button>{!token && <p className="vet-chat-help">Completa nuevamente la verificación de seguridad para reintentar.</p>}</div></div>}
      </div>)}
      {pending && <div className="vet-chat-message vet-chat-message-assistant vet-chat-typing" role="status"><span className="vet-chat-avatar" aria-hidden="true">✦</span><p><span aria-hidden="true">● ● ●</span> VetIA está respondiendo…</p></div>}
    </section>
    <form ref={form} onSubmit={send} aria-busy={pending} className="vet-chat-composer">
      {draftUrgent && <p role="alert" className="vet-chat-urgent-draft"><strong>Puede ser una urgencia.</strong> Busca atención veterinaria inmediata si tiene dificultad para respirar, convulsiones, sangrado intenso, posible intoxicación o no puede orinar.</p>}
      <details className="vet-chat-options"><summary>Buscar veterinarias por ciudad <span>(opcional)</span></summary><label>Ciudad<select value={city} onChange={(event) => setCity(event.target.value)} className="vet-field"><option value="">Sin preferencia</option>{cities.map((name) => <option key={name}>{name}</option>)}</select></label></details>
      <div className="vet-chat-compose-row"><label className="sr-only" htmlFor="assistant-message">Escribe tu consulta</label><textarea id="assistant-message" value={message} onChange={(event) => setMessage(event.target.value)} onKeyDown={keyDown} disabled={pending || Boolean(currentFailed)} required minLength={3} maxLength={maxMessageLength} rows={1} placeholder="Escribe sobre tu mascota…" className="vet-field vet-chat-input" /><button type="submit" aria-label="Enviar consulta" disabled={pending || Boolean(currentFailed) || (!token && !draftUrgent)} className="vet-button vet-button-primary vet-chat-send">{pending ? "…" : "Enviar"}</button></div>
      <div className="vet-chat-composer-footer"><div className="vet-chat-security"><span>Verificación de seguridad</span><div ref={target} /></div><p>{turns.length}/{maxContextMessages} mensajes recientes · No incluyas teléfonos, direcciones ni documentos.</p></div>
      {challengeError && <p role="alert" className="vet-chat-help vet-chat-help-error">No se pudo cargar la verificación de seguridad. Recarga la página o usa el directorio.</p>}
      {error && !currentFailed && <p role="alert" className="vet-chat-help vet-chat-help-error">{error}</p>}
    </form>
  </section>;
}
