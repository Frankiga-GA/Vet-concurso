"use client";

import { useActionState, useId, useState } from "react";
import { requestAppointment } from "@/app/veterinarias/actions";
import type { AppointmentResult } from "./contract";

const input = "vet-field";

export function RequestForm({
  clinicId,
  requestKey,
  intakeToken,
}: {
  clinicId: string;
  requestKey: string;
  intakeToken: string;
}) {
  const [draft, setDraft] = useState({ name: "", phone: "", reason: "", preferred: "" });
  const formId = useId();
  const [result, action, pending] = useActionState(
    async (previous: AppointmentResult, form: FormData) => {
      return requestAppointment(previous, form);
    },
    { message: "" }
  );

  function fieldFeedback(field: keyof typeof draft) {
    const error = result.fields?.[field];
    const id = `${formId}-${field}`;
    return {
      props: { "aria-invalid": error ? true : undefined, "aria-describedby": error ? id : undefined },
      message: error && <span id={id} className="block text-sm text-rose-800">{error}</span>,
    };
  }

  if (result.reference) {
    return (
      <div role="status" className="vet-notice vet-notice-info mt-4">
        <p className="font-bold">Solicitud enviada · Pendiente de coordinación</p>
        <p>{result.message}</p>
        <p className="mt-2 break-all font-semibold">Referencia: {result.reference}</p>
        <p className="mt-2 text-sm">Guarda la referencia. La solicitud todavía no es una cita confirmada.</p>
      </div>
    );
  }

  const name = fieldFeedback("name");
  const phone = fieldFeedback("phone");
  const reason = fieldFeedback("reason");
  const preferred = fieldFeedback("preferred");

  return (
    <form action={action} className="mt-4 space-y-4" aria-busy={pending}>
      <input type="hidden" name="clinicId" value={clinicId} />
      <input type="hidden" name="requestKey" value={requestKey} />
      <input type="hidden" name="token" value={intakeToken} />
      {/* Honeypot field for bot trapping */}
      <div hidden aria-hidden="true">
        <label>
          Sitio web
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <fieldset disabled={pending} className="min-w-0 space-y-4">
        <label className="block font-medium">
          Nombre de contacto
          <input
            {...name.props}
            className={input}
            name="name"
            autoComplete="name"
            minLength={2}
            maxLength={120}
            required
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          />
          {name.message}
        </label>
        <label className="block font-medium">
          Teléfono
          <input
            {...phone.props}
            className={input}
            name="phone"
            autoComplete="tel"
            type="tel"
            maxLength={32}
            required
            value={draft.phone}
            onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
          />
          {phone.message}
        </label>
        <label className="block font-medium">
          Motivo
          <textarea
            {...reason.props}
            className={input}
            name="reason"
            rows={3}
            minLength={5}
            maxLength={500}
            required
            value={draft.reason}
            onChange={(e) => setDraft({ ...draft, reason: e.target.value })}
          />
          {reason.message}
        </label>
        <label className="block font-medium">
          Horario preferido (hora de Perú)
          <input
            {...preferred.props}
            className={input}
            name="preferred"
            type="datetime-local"
            required
            value={draft.preferred}
            onChange={(e) => setDraft({ ...draft, preferred: e.target.value })}
          />
          {preferred.message}
        </label>
      </fieldset>
      <p className="text-sm text-slate-600">
        El establecimiento recibirá tus datos para coordinar la cita. Si necesitas atención inmediata, llama directamente a la veterinaria.
      </p>
      <button
        type="submit"
        disabled={pending}
        className="vet-button vet-button-primary w-full sm:w-auto"
      >
        {pending ? "Enviando…" : "Enviar solicitud"}
      </button>
      {result.message && <p role="alert" className="vet-notice vet-notice-danger text-sm">{result.message}</p>}
    </form>
  );
}
