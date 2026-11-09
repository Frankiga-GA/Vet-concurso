"use client";

import { useRef, useState, useTransition, type FormEvent } from "react";
import { submitClinicApplication } from "@/app/account/clinic-applications/actions";
import { cities, createSubmissionKeys, parseApplication, submissionSlot } from "./submission";

const inputClass = "vet-field";
const days = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
type Hours = { day: number; start: string; end: string };

export function ApplicationForm({ userId }: { userId: string }) {
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const [hours, setHours] = useState<Hours[]>([{ day: 1, start: "09:00", end: "18:00" }]);
  const sending = useRef(false);
  const keys = useRef<ReturnType<typeof createSubmissionKeys> | null>(null);

  function updateHour(index: number, change: Partial<Hours>) {
    setHours((current) => current.map((hour, item) => item === index ? { ...hour, ...change } : hour));
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending.current || pending) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    data.set("openingHours", JSON.stringify(hours));
    const application = parseApplication(data);
    if (!application.success) {
      setResult({ ok: false, message: application.error.issues[0].message });
      return;
    }
    if (!keys.current) {
      let storage: Storage | undefined;
      try { storage = window.sessionStorage; } catch { /* In-memory fallback preserves same-page retries. */ }
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
          setHours([{ day: 1, start: "09:00", end: "18:00" }]);
          submissionKeys.complete(slot);
        }
        setResult(response);
      } catch {
        setResult({ ok: false, message: "No pudimos confirmar el envío. Revisa tus solicitudes o vuelve a intentarlo con los mismos datos." });
      } finally { sending.current = false; }
    });
  }

  return <form method="post" onSubmit={submit} aria-busy={pending} className="mt-5">
    <fieldset disabled={pending} className="space-y-6">
      <section className="vet-form-section"><h3 className="font-semibold">Establecimiento</h3><div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium">Nombre comercial<input className={inputClass} name="businessName" autoComplete="organization" required minLength={2} maxLength={180} /></label>
        <label className="block text-sm font-medium">Razón social<input className={inputClass} name="legalName" required minLength={2} maxLength={180} /></label>
        <label className="block text-sm font-medium">RUC<input className={inputClass} name="ruc" inputMode="numeric" required minLength={11} maxLength={11} pattern="[0-9]{11}" /></label>
        <label className="block text-sm font-medium">Ciudad<select className={inputClass} name="city" defaultValue="" required><option value="" disabled>Selecciona una ciudad</option>{cities.map((city) => <option key={city}>{city}</option>)}</select></label>
        <label className="block text-sm font-medium sm:col-span-2">Dirección<input className={inputClass} name="address" autoComplete="street-address" required minLength={5} maxLength={200} /></label>
      </div></section>
      <section className="vet-form-section"><h3 className="font-semibold">Contacto y responsables</h3><div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium">Nombre de contacto<input className={inputClass} name="contactName" autoComplete="name" required minLength={2} maxLength={120} /></label>
        <label className="block text-sm font-medium">Correo de contacto<input className={inputClass} name="contactEmail" type="email" autoComplete="email" required maxLength={254} /></label>
        <label className="block text-sm font-medium">Teléfono de contacto<input className={inputClass} name="contactPhone" type="tel" autoComplete="tel" required minLength={6} maxLength={32} /></label>
        <label className="block text-sm font-medium">Responsable legal<input className={inputClass} name="legalRepresentativeName" required minLength={2} maxLength={120} /></label>
        <label className="block text-sm font-medium">Documento del responsable<input className={inputClass} name="legalRepresentativeDocument" required minLength={8} maxLength={20} autoComplete="off" aria-describedby="document-help" /></label>
        <label className="block text-sm font-medium">Veterinario responsable<input className={inputClass} name="veterinarianName" required minLength={2} maxLength={120} /></label>
        <label className="block text-sm font-medium">Colegiatura<input className={inputClass} name="veterinarianLicense" required minLength={3} maxLength={40} /></label>
      </div><p id="document-help" className="vet-help">Este documento es privado: no aparece en el directorio ni en perfiles públicos.</p></section>
      <section className="vet-form-section"><h3 className="font-semibold">Servicios y horarios informativos</h3><div className="mt-4 grid gap-4">
        <label className="block text-sm font-medium">Servicios<textarea className={inputClass} name="services" required rows={3} maxLength={1600} placeholder="Consulta general&#10;Vacunación&#10;Emergencias" /><span className="vet-help">Escribe uno por línea. Los horarios no representan disponibilidad en tiempo real.</span></label>
        <input name="openingHours" type="hidden" value={JSON.stringify(hours)} readOnly />
        <div className="grid gap-3">{hours.map((hour, index) => <div key={index} className="grid items-end gap-3 rounded-xl border border-[var(--line)] p-3 sm:grid-cols-[1fr_8rem_8rem_auto]">
          <label className="block text-sm font-medium">Día<select className={inputClass} value={hour.day} onChange={(event) => updateHour(index, { day: Number(event.target.value) })}>{days.map((day, value) => <option key={day} value={value}>{day}</option>)}</select></label>
          <label className="block text-sm font-medium">Desde<input className={inputClass} type="time" value={hour.start} onChange={(event) => updateHour(index, { start: event.target.value })} required /></label>
          <label className="block text-sm font-medium">Hasta<input className={inputClass} type="time" value={hour.end} onChange={(event) => updateHour(index, { end: event.target.value })} required /></label>
          <button type="button" className="vet-button vet-button-ghost" disabled={hours.length === 1} onClick={() => setHours((current) => current.filter((_, item) => item !== index))}>Quitar</button>
        </div>)}</div>
        <button type="button" className="vet-button vet-button-secondary w-fit" disabled={hours.length >= 14} onClick={() => setHours((current) => [...current, { day: 2, start: "09:00", end: "18:00" }])}>+ Agregar horario</button>
      </div></section>
      <button type="submit" className="vet-button vet-button-primary">{pending ? "Enviando…" : "Enviar solicitud"}</button>
    </fieldset>
    {result && <p role={result.ok ? "status" : "alert"} className={`vet-notice mt-4 text-sm ${result.ok ? "vet-notice-info" : "vet-notice-danger"}`}>{result.message}</p>}
  </form>;
}
