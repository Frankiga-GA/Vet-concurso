"use client";

import { useActionState, useState } from "react";
import { confirmAppointment } from "@/app/clinic/[clinicId]/appointments/actions";

export function ConfirmationForm({ clinicId, appointmentId }: { clinicId: string; appointmentId: string }) {
  const [state, action, pending] = useActionState(confirmAppointment, { message: "" });
  const [agreed, setAgreed] = useState("");
  const [coordinated, setCoordinated] = useState(false);
  return <details className="mt-4 border-t border-slate-200 pt-3">
    <summary className="cursor-pointer font-semibold text-emerald-800">Registrar horario acordado</summary>
    <form action={action} className="mt-3 space-y-3" aria-busy={pending}>
      <input type="hidden" name="clinicId" value={clinicId} />
      <input type="hidden" name="appointmentId" value={appointmentId} />
      <fieldset disabled={pending || Boolean(state.reference)} className="min-w-0 space-y-3">
        <label className="block text-sm font-medium">Fecha y hora acordadas (hora de Perú)
          <input className="mt-1 w-full rounded-xl border border-slate-300 p-2 text-base" name="agreed" type="datetime-local" required value={agreed} onChange={(event) => setAgreed(event.target.value)} />
        </label>
        <label className="flex items-start gap-2 text-sm">
          <input className="mt-1" type="checkbox" name="coordinated" value="yes" required checked={coordinated} onChange={(event) => setCoordinated(event.target.checked)} />
          Ya coordiné este horario con el propietario.
        </label>
        <button type="submit" className="rounded-xl bg-emerald-800 px-4 py-2 font-semibold text-white disabled:opacity-60">
          {pending ? "Confirmando…" : "Confirmar cita"}
        </button>
      </fieldset>
      {state.message && <p role={state.reference ? "status" : "alert"} className="text-sm">{state.message}</p>}
    </form>
  </details>;
}
