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
      <section className="vet-form-section">
        <h3 className="font-semibold text-[var(--ink)]">1. Datos del establecimiento</h3>
        <p className="vet-muted text-xs mt-0.5">El RUC debe corresponder a un establecimiento formal en Chincha, Pisco o Ica.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium">Nombre comercial<input className={inputClass} name="businessName" autoComplete="organization" required minLength={2} maxLength={180} placeholder="Ej. Veterinaria San Martín" /></label>
          <label className="block text-sm font-medium">Razón social<input className={inputClass} name="legalName" required minLength={2} maxLength={180} placeholder="Ej. Servicios Veterinarios San Martín S.A.C." /></label>
          <label className="block text-sm font-medium">RUC (11 dígitos)<input className={inputClass} name="ruc" inputMode="numeric" required minLength={11} maxLength={11} pattern="[0-9]{11}" placeholder="Ej. 20123456789" /></label>
          <label className="block text-sm font-medium">Ciudad<select className={inputClass} name="city" defaultValue="" required><option value="" disabled>Selecciona una ciudad</option>{cities.map((city) => <option key={city}>{city}</option>)}</select></label>
          <label className="block text-sm font-medium sm:col-span-2">Dirección fiscal o del local<input className={inputClass} name="address" autoComplete="street-address" required minLength={5} maxLength={200} placeholder="Ej. Av. San Martín 123" /></label>
        </div>
      </section>

      <section className="vet-form-section">
        <h3 className="font-semibold text-[var(--ink)]">2. Contacto y responsables acreditados</h3>
        <p className="vet-muted text-xs mt-0.5">Se verificará la personería jurídica del representante y la habilidad del médico veterinario en el CMVP.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium">Nombre de contacto operativo<input className={inputClass} name="contactName" autoComplete="name" required minLength={2} maxLength={120} /></label>
          <label className="block text-sm font-medium">Correo de contacto institucional<input className={inputClass} name="contactEmail" type="email" autoComplete="email" required maxLength={254} /></label>
          <label className="block text-sm font-medium">Teléfono de contacto<input className={inputClass} name="contactPhone" type="tel" autoComplete="tel" required minLength={6} maxLength={32} /></label>
          <label className="block text-sm font-medium">Titular o representante legal<input className={inputClass} name="legalRepresentativeName" required minLength={2} maxLength={120} placeholder="Nombre completo según DNI/SUNARP" /></label>
          <label className="block text-sm font-medium">DNI/CE del representante legal<input className={inputClass} name="legalRepresentativeDocument" required minLength={8} maxLength={20} autoComplete="off" aria-describedby="document-help" placeholder="Número de documento de identidad" /></label>
          <label className="block text-sm font-medium">Médico veterinario colegiado<input className={inputClass} name="veterinarianName" required minLength={2} maxLength={120} placeholder="Nombre del MV responsable" /></label>
          <label className="block text-sm font-medium">Número de colegiatura CMVP<input className={inputClass} name="veterinarianLicense" required minLength={3} maxLength={40} placeholder="Ej. CMVP-12345" /></label>
        </div>
        <p id="document-help" className="vet-help">El documento de identidad es estrictamente confidencial: se utiliza solo para cotejo administrativo y no será público.</p>
      </section>

      <section className="vet-form-section">
        <h3 className="font-semibold text-[var(--ink)]">3. Servicios y horarios informativos</h3>
        <div className="mt-4 grid gap-4">
          <label className="block text-sm font-medium">Servicios que presta la clínica<textarea className={inputClass} name="services" required rows={3} maxLength={1600} placeholder="Consulta general&#10;Vacunación&#10;Cirugía general&#10;Emergencias 24h" /><span className="vet-help">Escribe un servicio por línea. Los horarios tienen carácter meramente orientativo.</span></label>
          <input name="openingHours" type="hidden" value={JSON.stringify(hours)} readOnly />
          <div className="grid gap-3">{hours.map((hour, index) => <div key={index} className="grid items-end gap-3 rounded-xl border border-[var(--line)] p-3 sm:grid-cols-[1fr_8rem_8rem_auto]">
            <label className="block text-sm font-medium">Día<select className={inputClass} value={hour.day} onChange={(event) => updateHour(index, { day: Number(event.target.value) })}>{days.map((day, value) => <option key={day} value={value}>{day}</option>)}</select></label>
            <label className="block text-sm font-medium">Desde<input className={inputClass} type="time" value={hour.start} onChange={(event) => updateHour(index, { start: event.target.value })} required /></label>
            <label className="block text-sm font-medium">Hasta<input className={inputClass} type="time" value={hour.end} onChange={(event) => updateHour(index, { end: event.target.value })} required /></label>
            <button type="button" className="vet-button vet-button-ghost" disabled={hours.length === 1} onClick={() => setHours((current) => current.filter((_, item) => item !== index))}>Quitar</button>
          </div>)}</div>
          <button type="button" className="vet-button vet-button-secondary w-fit" disabled={hours.length >= 14} onClick={() => setHours((current) => [...current, { day: 2, start: "09:00", end: "18:00" }])}>+ Agregar horario</button>
        </div>
      </section>

      {/* Declaración Jurada Obligatoria */}
      <section className="rounded-2xl border-2 border-emerald-300 bg-emerald-50/70 p-5 space-y-3">
        <h3 className="text-base font-bold text-[var(--green-dark)] flex items-center gap-2">
          <span>📋</span> Declaración jurada de titularidad o representación legal
        </h3>
        <p className="text-xs text-slate-700 leading-relaxed">
          Para garantizar la seguridad de los pacientes y la formalidad del directorio, en VetIA una cuenta normal <strong>no puede crear ni administrar veterinarias directamente</strong>. Solo puedes solicitar incorporación declarando ser propietario o representante legal facultado y aportando los documentos de sustento.
        </p>
        <div className="rounded-xl border border-emerald-200 bg-white p-3 text-xs text-slate-700 space-y-1.5">
          <p className="font-bold text-slate-900">Alcance de la solicitud de incorporación:</p>
          <ul className="list-disc list-inside space-y-1 text-slate-600">
            <li>La solicitud <strong>no otorga acceso operativo inmediato al panel de la clínica</strong>.</li>
            <li>La solicitud <strong>no publica la clínica en el directorio</strong>.</li>
            <li>El superadministrador revisará los documentos adjuntos (DNI, Poder SUNARP, Ficha RUC activa en SUNAT y Colegiatura CMVP).</li>
            <li>Aprobación, activación de permisos y publicación son fases estrictamente separadas.</li>
            <li>No se admiten solicitudes duplicadas para un mismo RUC.</li>
          </ul>
        </div>
        <label className="flex items-start gap-3 cursor-pointer pt-2 select-none">
          <input
            type="checkbox"
            name="declarationAcknowledged"
            required
            className="mt-1 h-4 w-4 rounded border-emerald-400 text-[var(--green)] focus:ring-emerald-500"
          />
          <span className="text-xs font-semibold text-slate-800">
            Declaro bajo juramento que soy propietario(a) o representante legal debidamente facultado(a) de este establecimiento, que toda la información consignada es verídica y que aportaré los documentos de sustento requeridos para la verificación.
          </span>
        </label>
      </section>

      <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
        <button type="submit" className="vet-button vet-button-primary !w-full sm:!w-auto">
          {pending ? "Enviando solicitud…" : "Solicitar incorporación de mi clínica"}
        </button>
        <span className="text-xs text-[var(--muted)] text-center sm:text-left">
          Tras enviar, deberás adjuntar tus documentos de sustento.
        </span>
      </div>
    </fieldset>
    {result && <p role={result.ok ? "status" : "alert"} className={`vet-notice mt-4 text-sm ${result.ok ? "vet-notice-info" : "vet-notice-danger"}`}>{result.message}</p>}
  </form>;
}
