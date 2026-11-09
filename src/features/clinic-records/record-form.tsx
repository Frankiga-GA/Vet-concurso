"use client";

import { useActionState, useState } from "react";
import { limaToday } from "./date";
import type { RecordResult } from "./contract";

const clientFields = [
  { key: "name", label: "Nombre completo", type: "text", max: 180, required: true },
  { key: "phone", label: "Teléfono", type: "tel", max: 32, required: true },
  { key: "email", label: "Correo electrónico", type: "email", max: 254, required: false },
] as const;
const patientFields = [
  { key: "name", label: "Nombre del paciente", type: "text", max: 120, required: true },
  { key: "species", label: "Especie", type: "text", max: 60, required: true },
  { key: "breed", label: "Raza", type: "text", max: 120, required: false },
  { key: "birthDate", label: "Fecha de nacimiento", type: "date", max: undefined, required: false },
] as const;
const inputClass = "vet-field";

export function ClinicRecordForm({ recordId, kind, action }: {
  recordId: string;
  kind: "client" | "patient";
  action: (previous: RecordResult, form: FormData) => Promise<RecordResult>;
}) {
  const [state, submit, pending] = useActionState(action, {});
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [confirmed, setConfirmed] = useState(false);
  const [id] = useState(recordId);
  const patient = kind === "patient";

  function update(key: string, value: string) {
    setDraft((current) => ({ ...current, [key]: value }));
    setConfirmed(false);
  }

  return <form action={submit} aria-busy={pending} className="mt-4">
    <fieldset disabled={pending} className="grid min-w-0 gap-4">
      <input type="hidden" name="recordId" value={id} />
      {(patient ? patientFields : clientFields).map((field) => <label key={field.key} className="font-medium">
        {field.label}{!field.required && <span className="text-sm font-normal"> (opcional)</span>}
        <input name={field.key} className={inputClass} required={field.required} type={field.type} maxLength={field.max}
          min={field.type === "date" ? "1900-01-01" : undefined} max={field.type === "date" ? limaToday() : undefined}
          value={draft[field.key] ?? ""} onChange={(event) => update(field.key, event.target.value)} />
      </label>)}
      {patient && <label className="font-medium">Sexo <span className="text-sm font-normal">(opcional)</span>
        <select name="sex" className={inputClass} value={draft.sex ?? ""} onChange={(event) => update("sex", event.target.value)}>
          <option value="">Sin registrar</option><option value="female">Hembra</option>
          <option value="male">Macho</option><option value="unknown">Desconocido</option>
        </select>
      </label>}
      {state.message && <p role="alert" className="vet-notice vet-notice-danger text-sm font-semibold">{state.message}</p>}
      {state.similar && <label className="vet-notice vet-notice-warning flex items-start gap-2 text-sm">
        <input type="checkbox" name="allowSimilar" value="yes" className="mt-1"
          checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />
        Confirmo que es un registro distinto.
      </label>}
      <button className="vet-button vet-button-primary w-full sm:w-auto">
        {pending ? "Guardando…" : patient ? "Registrar paciente" : "Registrar cliente"}
      </button>
    </fieldset>
  </form>;
}
