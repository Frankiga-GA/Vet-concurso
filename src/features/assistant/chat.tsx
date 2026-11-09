"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { cities } from "@/features/appointments/contract";
import { assistantReply, maxContextMessages, maxMessageLength, type AssistantReply } from "./contract";
import { emergencyReply, hasUrgency, minimizePersonalData } from "./safety";

type Turn = { id: number; message: string; reply?: AssistantReply; failed?: boolean };
const genericError = "No pudimos consultar el asistente. Puedes buscar una veterinaria en el directorio.";

export function AssistantChat() {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [message, setMessage] = useState("");
  const [city, setCity] = useState("");
  const [mode, setMode] = useState<"mascotas" | "agro">("mascotas");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [failedTurnId, setFailedTurnId] = useState<number>();
  const conversation = useRef<HTMLElement>(null);
  const form = useRef<HTMLFormElement>(null);
  const sending = useRef(false);
  const counter = useRef(0);
  const stickToLatest = useRef(true);
  const draftUrgent = hasUrgency([message], mode);
  const currentFailed = turns.find((turn) => turn.id === failedTurnId);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const paramMode = urlParams.get("mode");
      if (paramMode === "agro") {
        setMode("agro");
      }
    }
  }, []);

  useEffect(() => {
    if (stickToLatest.current) {
      conversation.current?.scrollTo({ top: conversation.current.scrollHeight, behavior: "smooth" });
    }
  }, [turns, pending]);

  function updateTurn(id: number, change: Partial<Turn>) {
    setTurns((previous) => previous.map((turn) => (turn.id === id ? { ...turn, ...change } : turn)));
  }

  async function requestReply(turn: Turn, messages: string[]) {
    if (sending.current) return;
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
        body: JSON.stringify({ messages, city: city || null, mode }),
      });
      const body = await response.json().catch(() => null);
      const parsed = assistantReply.safeParse(body);
      if (response.ok && parsed.success) {
        updateTurn(turn.id, { reply: parsed.data });
      } else {
        if (hasUrgency(messages, mode)) {
          updateTurn(turn.id, { reply: emergencyReply([], mode) });
        } else {
          updateTurn(turn.id, { failed: true });
          setFailedTurnId(turn.id);
          setError(typeof body?.error === "string" ? body.error : genericError);
        }
      }
    } catch {
      if (hasUrgency(messages, mode)) {
        updateTurn(turn.id, { reply: emergencyReply([], mode) });
      } else {
        updateTurn(turn.id, { failed: true });
        setFailedTurnId(turn.id);
        setError(genericError);
      }
    } finally {
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
    void requestReply(turn, messages);
  }

  function retry() {
    if (!currentFailed) return;
    const index = turns.findIndex((turn) => turn.id === currentFailed.id);
    const messages = turns.slice(0, index + 1).map((turn) => turn.message).slice(-maxContextMessages);
    void requestReply(currentFailed, messages);
  }

  function keyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      form.current?.requestSubmit();
    }
  }

  function newConversation() {
    setTurns([]);
    setMessage("");
    setError("");
    setFailedTurnId(undefined);
  }

  return (
    <section aria-label="Asistente VetIA" className="vet-chat">
      <header className="vet-chat-header">
        <div className="vet-chat-brand">
          <span className="vet-chat-avatar" aria-hidden="true">
            {mode === "agro" ? "🌾" : "✦"}
          </span>
          <div>
            <h2>{mode === "agro" ? "VetIA Agro" : "VetIA Mascotas"}</h2>
            <p>
              {mode === "agro"
                ? "Orientación zoosanitaria y pecuaria"
                : "Orientación inicial para tu mascota"}
            </p>
          </div>
        </div>

        {/* Mode Selector & Actions */}
        <div className="vet-chat-header-actions">
          <div className="flex items-center gap-1 rounded-lg border border-slate-200/90 bg-slate-50 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => {
                setMode("mascotas");
                newConversation();
              }}
              className={`px-2 py-1 rounded-md font-bold transition ${
                mode === "mascotas"
                  ? "bg-[var(--green)] !text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              🐾 Mascotas
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("agro");
                newConversation();
              }}
              className={`px-2 py-1 rounded-md font-bold transition ${
                mode === "agro"
                  ? "bg-[var(--green)] !text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              🌾 Agro
            </button>
          </div>

          <Link href="/veterinarias" className="vet-chat-directory">
            Directorio
          </Link>
          <button
            type="button"
            className="vet-button vet-button-ghost vet-chat-new"
            onClick={newConversation}
            disabled={pending}
          >
            Nueva conversación
          </button>
        </div>
      </header>

      <section
        ref={conversation}
        aria-label="Conversación"
        aria-live="polite"
        onScroll={(event) => {
          const element = event.currentTarget;
          stickToLatest.current = element.scrollHeight - element.scrollTop - element.clientHeight < 48;
        }}
        className="vet-chat-body"
      >
        {turns.length === 0 && (
          <div className="vet-chat-welcome">
            <span className="vet-chat-avatar vet-chat-avatar-large" aria-hidden="true">
              {mode === "agro" ? "🌾" : "✦"}
            </span>
            <h3>{mode === "agro" ? "Hola, soy VetIA Agro" : "Hola, soy VetIA"}</h3>
            <p>
              {mode === "agro"
                ? "Describe los signos que notas en tu lote o ganado (bovinos, porcinos, ovinos, caprinos o aves). Te orientaré con criterios técnicos de bioseguridad y, ante sospecha de brotes o enfermedades de reporte obligatorio, te indicaré pautas de aislamiento y reporte a SENASA."
                : "Describe lo que le ocurre a tu mascota con tus propias palabras. Te orientaré con empatía y consejos prácticos, y si detecto una urgencia te indicaré dónde acudir de inmediato."}
            </p>

            <div className="vet-chat-prompts" aria-label="Ejemplos de consulta">
              {mode === "agro" ? (
                <>
                  <button
                    type="button"
                    onClick={() => setMessage("Sospecha de mastitis en vaca lechera con leche grumosa")}
                  >
                    🐮 Mastitis en vaca lechera
                  </button>
                  <button
                    type="button"
                    onClick={() => setMessage("Lote de lechones recién destetados con diarrea acuosa")}
                  >
                    🐷 Diarrea en lechones
                  </button>
                  <button
                    type="button"
                    onClick={() => setMessage("Mortalidad repentina de aves en galpón con cresta morada")}
                  >
                    🐔 Alerta sanitaria en aves
                  </button>
                  <button
                    type="button"
                    onClick={() => setMessage("Protocolo de vacunación contra Carbunco y Fiebre Aftosa")}
                  >
                    🌾 Vacunación Aftosa y Carbunco
                  </button>
                </>
              ) : (
                <>
                  <button type="button" onClick={() => setMessage("Mi perro no quiere comer desde ayer")}>
                    Mi perro no quiere comer
                  </button>
                  <button type="button" onClick={() => setMessage("¿Cómo cuido los dientes de mi gato?")}>
                    Cuidado dental de mi gato
                  </button>
                  <button
                    type="button"
                    onClick={() => setMessage("Mi cachorrito de 3 meses tiene diarrea leve, ¿qué observo?")}>
                    Diarrea en cachorro
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {turns.map((turn) => (
          <div key={turn.id} className="vet-chat-turn">
            <div className="vet-chat-message vet-chat-message-user">
              <span className="sr-only">Tú: </span>
              <p>{turn.message}</p>
            </div>
            {turn.reply && (
              <div
                className={
                  turn.reply.urgent
                    ? "vet-chat-message vet-chat-message-emergency"
                    : "vet-chat-message vet-chat-message-assistant"
                }
              >
                <span className="vet-chat-avatar" aria-hidden="true">
                  {turn.reply.urgent ? "!" : mode === "agro" ? "🌾" : "✦"}
                </span>
                <div className="vet-chat-content">
                  <p className="vet-chat-speaker">
                    {turn.reply.urgent
                      ? mode === "agro"
                        ? "🚨 Alerta Zoosanitaria Requerida"
                        : "Atención inmediata requerida"
                      : mode === "agro"
                      ? "VetIA Agro"
                      : "VetIA"}
                  </p>
                  <div className="vet-chat-prose whitespace-pre-line">
                    {turn.reply.text.split("\n\n").map((paragraph, index) => (
                      <p key={index}>{paragraph}</p>
                    ))}
                  </div>
                  {turn.reply.question && <p className="vet-chat-question">{turn.reply.question}</p>}
                  {turn.reply.clinics.length > 0 && (
                    <div className="vet-chat-clinics-block">
                      <p className="vet-chat-clinics-heading">
                        {turn.reply.urgent
                          ? "Clínicas recomendadas para acudir de inmediato:"
                          : "Clínicas veterinarias recomendadas:"}
                      </p>
                      <ul className="vet-chat-suggestions" aria-label="Veterinarias sugeridas">
                        {turn.reply.clinics.map((clinic) => (
                          <li key={clinic.slug} className="vet-chat-clinic-card">
                            <div className="vet-chat-clinic-main">
                              <div className="vet-chat-clinic-header">
                                <span className="vet-chat-clinic-name">{clinic.name}</span>
                                <span className="vet-badge vet-badge-city">{clinic.city}</span>
                              </div>
                              {clinic.address && (
                                <p className="vet-chat-clinic-address">
                                  <span aria-hidden="true">📍</span> {clinic.address}
                                </p>
                              )}
                            </div>
                            <div className="vet-chat-clinic-actions">
                              {clinic.phone && (
                                <a
                                  href={`tel:${clinic.phone}`}
                                  className="vet-chat-clinic-action-btn vet-chat-clinic-call"
                                  aria-label={`Llamar a ${clinic.name}`}
                                >
                                  <span aria-hidden="true">📞</span> {clinic.phone}
                                </a>
                              )}
                              <Link
                                href={`/veterinarias/${clinic.slug}`}
                                className="vet-chat-clinic-action-btn vet-chat-clinic-link"
                              >
                                Ver ficha →
                              </Link>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {turn.reply.urgent && turn.reply.clinics.length === 0 && (
                    <div className="vet-chat-no-clinics" role="alert">
                      <p>
                        <span aria-hidden="true">⚠️</span> <strong>Aviso:</strong> No hay clínicas disponibles en el directorio en este momento. Coordina con el puesto de control SENASA más cercano o un médico veterinario colegiado local.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
            {turn.failed && (
              <div className="vet-chat-message vet-chat-message-error" role="alert">
                <span className="vet-chat-avatar" aria-hidden="true">
                  !
                </span>
                <div>
                  <p className="vet-chat-speaker">No se pudo responder</p>
                  <p>{error || genericError}</p>
                  <button type="button" className="vet-link" disabled={pending} onClick={retry}>
                    Reintentar esta consulta
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
        {pending && (
          <div className="vet-chat-message vet-chat-message-assistant vet-chat-typing" role="status">
            <span className="vet-chat-avatar" aria-hidden="true">
              {mode === "agro" ? "🌾" : "✦"}
            </span>
            <p>
              <span aria-hidden="true">● ● ●</span> {mode === "agro" ? "VetIA Agro está analizando…" : "VetIA está pensando…"}
            </p>
          </div>
        )}
      </section>

      <form ref={form} onSubmit={send} aria-busy={pending} className="vet-chat-composer">
        {draftUrgent && (
          <p role="alert" className="vet-chat-urgent-draft">
            <strong>{mode === "agro" ? "Alerta zoosanitaria crítica:" : "Puede ser una urgencia."}</strong>{" "}
            {mode === "agro"
              ? "Sospecha de cuadro de reporte obligatorio o riesgo vital. Aísla el lote y coordina con SENASA y un médico veterinario."
              : "Busca atención veterinaria inmediata si tiene dificultad para respirar, convulsiones, sangrado intenso, posible intoxicación o no puede orinar."}
          </p>
        )}
        <details className="vet-chat-options">
          <summary>Buscar veterinarias por ciudad <span>(opcional)</span></summary>
          <label>
            Ciudad
            <select value={city} onChange={(event) => setCity(event.target.value)} className="vet-field">
              <option value="">Sin preferencia</option>
              {cities.map((name) => (
                <option key={name}>{name}</option>
              ))}
            </select>
          </label>
        </details>
        <div className="vet-chat-compose-row">
          <label className="sr-only" htmlFor="assistant-message">
            Escribe tu consulta
          </label>
          <textarea
            id="assistant-message"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            onKeyDown={keyDown}
            disabled={pending || Boolean(currentFailed)}
            required
            minLength={3}
            maxLength={maxMessageLength}
            rows={1}
            placeholder={
              mode === "agro"
                ? "Describe el caso en tus vacunos, cerdos, ovinos, caprinos o aves…"
                : "Escribe sobre tu mascota…"
            }
            className="vet-field vet-chat-input"
          />
          <button
            type="submit"
            aria-label="Enviar consulta"
            disabled={pending || Boolean(currentFailed) || message.trim().length < 3}
            className="vet-button vet-button-primary vet-chat-send"
          >
            {pending ? "…" : "Enviar"}
          </button>
        </div>
        <div className="vet-chat-composer-footer">
          <p>{turns.length}/{maxContextMessages} mensajes recientes · No incluyas teléfonos, direcciones ni documentos.</p>
        </div>
        {error && !currentFailed && (
          <p role="alert" className="vet-chat-help vet-chat-help-error">
            {error}
          </p>
        )}
      </form>
    </section>
  );
}
