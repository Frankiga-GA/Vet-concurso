"use client";

import { useActionState, useState } from "react";
import { cities, days, fieldLabels, type ClinicProfile, type ProfileResult } from "./contract";

const control = "vet-field";

export function ClinicProfileForm({ profile, action }: {
  profile: ClinicProfile;
  action: (previous: ProfileResult, form: FormData) => Promise<ProfileResult>;
}) {
  const [state, submit, pending] = useActionState(action, { profile });
  const [draft, setDraft] = useState({
    name: profile.name, address: profile.address ?? "", phone: profile.phone ?? "",
    description: profile.description ?? "", services: profile.services.join("\n"), city: profile.city as string,
  });
  const [hours, setHours] = useState(profile.hours);
  const published = state.profile.publication === "published";
  const missing = state.profile.missing;
  const error = state.invalid ? "clinic-profile-feedback" : undefined;
  const fields = [
    { key: "name", max: 120 }, { key: "address", max: 200 }, { key: "phone", max: 16 },
    { key: "description", max: 1200 }, { key: "services", max: 1800 },
  ] as const;

  function editHour(index: number, change: Partial<ClinicProfile["hours"][number]>) {
    setHours((slots) => slots.map((slot, i) => i === index ? { ...slot, ...change } : slot));
  }

  return <form action={submit} className="mt-6 space-y-5" aria-busy={pending}>
    <section className={`vet-notice ${missing.length ? "vet-notice-warning" : "vet-notice-info"}`} aria-live="polite">
      <h2 className="font-semibold">{missing.length ? "Perfil guardado incompleto" : "Perfil guardado completo"}</h2>
      {missing.length > 0 && <p>Falta completar {missing.map((key) => fieldLabels[key]).join(", ")}.</p>}
      {published && <p>La ficha está publicada. Solicita su retiro autorizado antes de editarla.</p>}
    </section>
    <fieldset disabled={pending || published} className="vet-card grid gap-4">
      <legend className="px-1 font-semibold">Datos de la clínica</legend>
      <input type="hidden" name="revision" value={state.profile.revision} />
      {fields.map(({ key, max }) => {
        const shared = {
          name: key, value: draft[key], maxLength: max, className: control,
          "aria-invalid": state.invalid === key,
          "aria-describedby": state.invalid === key ? error : undefined,
        };
        return <label key={key} className="block font-medium">{fieldLabels[key]}
          {key === "description" || key === "services"
            ? <textarea {...shared} rows={4} onChange={(event) => setDraft({ ...draft, [key]: event.target.value })} />
            : <input {...shared} type={key === "phone" ? "tel" : "text"} required={key === "name"}
                onChange={(event) => setDraft({ ...draft, [key]: event.target.value })} />}
          {key === "services" && <span className="block text-sm font-normal">Escribe un servicio por línea, hasta 20.</span>}
          {key === "phone" && <span className="block text-sm font-normal">Usa de 6 a 15 dígitos y, si corresponde, el signo + al inicio.</span>}
        </label>;
      })}
      <label className="block font-medium">Ciudad
        <select name="city" className={control} value={draft.city}
          onChange={(event) => setDraft({ ...draft, city: event.target.value })}>
          {cities.map((city) => <option key={city}>{city}</option>)}
        </select>
      </label>
      <section aria-labelledby="clinic-hours" aria-describedby={state.invalid === "hours" ? error : undefined}>
        <h2 id="clinic-hours" className="font-semibold">Horarios</h2>
        <p className="text-sm text-slate-700">Hora de Perú en formato HH:MM. Usa 24:00 para el cierre a medianoche. Si un turno cruza medianoche, divídelo en dos días. El horario es informativo.</p>
        <input type="hidden" name="hours" value={JSON.stringify(hours)} />
        {hours.map((slot, index) => <fieldset key={index} className="mt-3 grid min-w-0 gap-2 rounded-xl border border-slate-300 p-3 sm:grid-cols-3">
          <legend className="px-1 text-sm font-semibold">Turno {index + 1}</legend>
          <label>Día
            <select className={control} value={slot.day} onChange={(event) => editHour(index, { day: Number(event.target.value) })}>
              {days.map((day, i) => <option key={day} value={i + 1}>{day}</option>)}
            </select>
          </label>
          <label>Desde<input className={control} maxLength={5} placeholder="09:00" value={slot.start} onChange={(event) => editHour(index, { start: event.target.value })} /></label>
          <label>Hasta<input className={control} maxLength={5} placeholder="18:00" value={slot.end} onChange={(event) => editHour(index, { end: event.target.value })} /></label>
          <button type="button" className="min-h-11 text-left font-semibold text-rose-800" onClick={() => setHours((slots) => slots.filter((_, i) => i !== index))}>Quitar turno {index + 1}</button>
        </fieldset>)}
        <button type="button" disabled={hours.length >= 28} className="mt-2 min-h-11 font-semibold text-emerald-800"
          onClick={() => setHours((slots) => [...slots, { day: 1, start: "", end: "" }])}>Añadir turno</button>
      </section>
      <button className="vet-button vet-button-primary"
        disabled={pending || published}>{pending ? "Guardando…" : "Guardar cambios"}</button>
    </fieldset>
    {state.message && <p id="clinic-profile-feedback" role={state.invalid ? "alert" : "status"}>{state.message}</p>}
  </form>;
}
