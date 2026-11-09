"use client";

import * as React from "react";
import { statusLabels, type applicationStatuses } from "./admin-query";
import { decisionRetrySlot, unconfirmedDecision, type DecisionAction, type DecisionDraft, type DecisionResult } from "./decision-contract";
import { createSubmissionKeys } from "./submission";

const decisions = [
  {
    id: "approve",
    label: "Aprobar",
    messageRequired: false,
    confirmation: "La aprobación creará una clínica pendiente de activación y una membresía administrativa pendiente. La veterinaria seguirá sin publicar.",
  },
  {
    id: "reject",
    label: "Rechazar",
    messageRequired: true,
    confirmation: "La solicitud quedaría rechazada y el motivo sería visible para el solicitante.",
  },
  {
    id: "request_information",
    label: "Solicitar información",
    messageRequired: true,
    confirmation: "La solicitud quedaría en espera de información y el solicitante podría consultar el mensaje.",
  },
] as const;

const textAreaClass = "vet-field";

function DecisionConfirmation({ label, children, enabled, pending, onConfirm }: {
  label: string;
  children: React.ReactNode;
  enabled: boolean;
  pending: boolean;
  onConfirm?: () => void;
}) {
  return <details className="mt-4 rounded-xl bg-slate-50 p-4">
    <summary className="cursor-pointer font-semibold text-emerald-900 focus-visible:outline-2 focus-visible:outline-emerald-700">
      Ver confirmación de {label.toLowerCase()}
    </summary>
    <p className="mt-3 text-sm text-slate-700">{children}</p>
    <button type="button" disabled={!enabled || pending} onClick={onConfirm} className="vet-button vet-button-primary mt-3 text-sm">
      {!enabled ? "Disponible después de validar seguridad" : pending ? "Enviando…" : `Confirmar: ${label.toLowerCase()}`}
    </button>
  </details>;
}

type Review = Pick<DecisionDraft, "applicationId" | "expectedReviewedAt"> & { userId: string };
type SubmitAction = (input: DecisionDraft & { operationId: string }) => Promise<DecisionResult>;

export function AdministrativeDecisionPreview({ status, review, submitDecisionAction, isAccredited = true }: {
  status: (typeof applicationStatuses)[number];
  review?: Review;
  submitDecisionAction?: SubmitAction;
  isAccredited?: boolean;
}) {
  const closed = status === "approved" || status === "rejected";
  const enabled = Boolean(review && submitDecisionAction);
  const messages = React.useRef<Partial<Record<DecisionAction, HTMLTextAreaElement | null>>>({});
  const notes = React.useRef<Partial<Record<DecisionAction, HTMLTextAreaElement | null>>>({});
  const keys = React.useRef<ReturnType<typeof createSubmissionKeys> | null>(null);
  const sending = React.useRef(false);
  const [pending, startTransition] = React.useTransition();
  const [result, setResult] = React.useState<DecisionResult | null>(null);
  const [confirmedRevision, setConfirmedRevision] = React.useState<string | null | undefined>(undefined);
  const waitingForDetail = result?.ok === true && confirmedRevision === review?.expectedReviewedAt;

  function confirm(action: DecisionAction) {
    if (!review || !submitDecisionAction || closed || waitingForDetail || sending.current || pending
      || (status === "needs_information" && action === "request_information")) return;
    const message = messages.current[action];
    const internalNote = notes.current[action];
    if (!message || !internalNote || !message.reportValidity() || !internalNote.reportValidity()) return;

    if (!keys.current) {
      let storage: Storage | undefined;
      try { storage = window.sessionStorage; } catch { /* Same-page retries use memory. */ }
      keys.current = createSubmissionKeys(storage);
    }
    const operationKeys = keys.current;
    const draft: DecisionDraft = {
      applicationId: review.applicationId,
      expectedReviewedAt: review.expectedReviewedAt,
      action,
      visibleMessage: message.value,
      internalNotes: internalNote.value,
    };
    sending.current = true;
    setResult(null);
    startTransition(async () => {
      try {
        const slot = await decisionRetrySlot(review.userId, draft);
        const response = await submitDecisionAction({ ...draft, operationId: operationKeys.get(slot) });
        if (response.ok) {
          setConfirmedRevision(draft.expectedReviewedAt);
          operationKeys.complete(slot);
        }
        setResult(response);
      } catch {
        setResult(unconfirmedDecision);
      } finally {
        sending.current = false;
      }
    });
  }

  return <section aria-labelledby="administrative-decision" className="vet-card space-y-3">
    <div>
      <p className="vet-eyebrow">Paso 4</p>
      <h2 id="administrative-decision" className="vet-card-title mt-0.5">Decisión administrativa final</h2>
      <p className="vet-muted mt-1 text-xs">{enabled
        ? "Revisa el mensaje y las notas antes de confirmar. La aprobación exige acreditación verificada y MFA reciente."
        : "Vista previa. Los textos que escribas aquí no se guardan ni se envían."}</p>
    </div>
    {closed && <p className="mt-2 text-sm font-semibold text-slate-700">Esta solicitud ya tiene una decisión final.</p>}
    {pending && <p role="status" className="mt-3 text-sm text-slate-700">Enviando decisión…</p>}
    {result?.ok === false && <p role="alert" className="mt-3 rounded-xl bg-rose-50 p-3 text-sm text-rose-900">{result.message}</p>}
    {result?.ok === true && <div role="status" className="mt-3 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-950">
      <p>Decisión registrada: {statusLabels[result.receipt.status]}.</p>
      {result.receipt.status === "approved" && <p>La clínica está pendiente de activación, con perfil incompleto y sin publicar. La membresía administrativa está pendiente.</p>}
    </div>}
    <div aria-busy={pending} className="mt-5 grid gap-3">
      {decisions.map(({ id, label, messageRequired, confirmation }) => {
        const allowed = !closed
          && !(status === "needs_information" && id === "request_information")
          && !(id === "approve" && !isAccredited);
        return <details key={id} className="rounded-2xl border border-slate-200 p-4 sm:p-5">
        <summary className="cursor-pointer font-semibold text-emerald-900 focus-visible:outline-2 focus-visible:outline-emerald-700">{label}</summary>
        {id === "approve" && <div className="mt-3 space-y-2">
          <p className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-950">
            Para aprobar se exige una acreditación vigente del representante y una verificación TOTP en los últimos diez minutos.
          </p>
          {!isAccredited && <p className="rounded-xl bg-amber-50 p-3 text-sm font-medium text-amber-900">
            ⚠️ Aprobación bloqueada: Debes verificar primero la acreditación oficial (SUNAT, CMVP, SUNARP) en la sección superior.
          </p>}
        </div>}
        <fieldset disabled={pending || (enabled && !allowed)} className="mt-4 grid gap-4 sm:grid-cols-2">
          <legend className="sr-only">Borrador de {label.toLowerCase()}</legend>
          <label className="block text-sm font-medium">
            Mensaje al solicitante ({messageRequired ? "obligatorio" : "opcional"})
            <textarea ref={(node) => { messages.current[id] = node; }} className={textAreaClass} rows={3} maxLength={2000} required={messageRequired} autoComplete="off" />
          </label>
          <label className="block text-sm font-medium">
            Notas internas (opcional)
            <textarea ref={(node) => { notes.current[id] = node; }} className={textAreaClass} rows={3} maxLength={4000} autoComplete="off" />
          </label>
        </fieldset>
        {enabled && !allowed ? <p className="mt-4 text-sm text-slate-700">
            {id === "approve" && !isAccredited
              ? "Esta acción requiere verificar previamente la acreditación oficial del establecimiento."
              : "Esta acción no está disponible para el estado actual."}
          </p>
          : <DecisionConfirmation label={label} enabled={enabled} pending={pending || waitingForDetail}
              onConfirm={enabled ? () => confirm(id) : undefined}>{confirmation}</DecisionConfirmation>}
        </details>;
      })}
    </div>
  </section>;
}
