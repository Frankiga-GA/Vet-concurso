"use client";

import { useState, useTransition, type FormEvent } from "react";
import { completeClinicApplicationDetails } from "@/app/account/clinic-applications/actions";

export function CompleteDetailsForm({
  applicationId,
  initialData,
}: {
  applicationId: string;
  initialData?: {
    legalName?: string | null;
    ruc?: string | null;
    address?: string | null;
    legalRepresentativeName?: string | null;
    veterinarianName?: string | null;
    veterinarianLicense?: string | null;
  };
}) {
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    data.set("applicationId", applicationId);
    setResult(null);
    startTransition(async () => {
      const res = await completeClinicApplicationDetails(data);
      setResult(res);
      if (res.ok) {
        setOpen(false);
      }
    });
  }

  const hasMissingData = !initialData?.ruc || !initialData?.legalName || !initialData?.veterinarianLicense;

  return (
    <div className="mt-3 rounded-xl border border-[var(--line)] bg-slate-50/70 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Datos legales y fiscales
          </span>
          <p className="text-xs text-slate-700 mt-0.5">
            {hasMissingData
              ? "⚠️ Información legal incompleta (RUC, razón social, representante o colegiatura)."
              : "RUC, representante y veterinario registrados."}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="vet-button vet-button-secondary text-xs"
        >
          {open ? "Cerrar formulario" : hasMissingData ? "Completar datos ahora" : "Editar datos legales"}
        </button>
      </div>

      {open && (
        <form onSubmit={handleSubmit} className="mt-4 space-y-4 border-t border-[var(--line)] pt-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-xs font-medium text-slate-700">
              Razón social
              <input
                name="legalName"
                required
                minLength={2}
                maxLength={180}
                defaultValue={initialData?.legalName ?? ""}
                className="vet-field mt-1 text-xs"
                placeholder="Ej. Servicios Veterinarios S.A.C."
              />
            </label>
            <label className="block text-xs font-medium text-slate-700">
              RUC (11 dígitos)
              <input
                name="ruc"
                required
                pattern="[0-9]{11}"
                maxLength={11}
                defaultValue={initialData?.ruc ?? ""}
                className="vet-field mt-1 text-xs"
                placeholder="20123456789"
              />
            </label>
            <label className="block text-xs font-medium text-slate-700 sm:col-span-2">
              Dirección del establecimiento
              <input
                name="address"
                required
                minLength={5}
                maxLength={200}
                defaultValue={initialData?.address ?? ""}
                className="vet-field mt-1 text-xs"
                placeholder="Av. Principal 123, Ica"
              />
            </label>
            <label className="block text-xs font-medium text-slate-700">
              Nombre de responsable legal
              <input
                name="legalRepresentativeName"
                required
                minLength={2}
                maxLength={120}
                defaultValue={initialData?.legalRepresentativeName ?? ""}
                className="vet-field mt-1 text-xs"
                placeholder="Nombres y apellidos"
              />
            </label>
            <label className="block text-xs font-medium text-slate-700">
              DNI/CE del responsable legal
              <input
                name="legalRepresentativeDocument"
                required
                minLength={8}
                maxLength={20}
                className="vet-field mt-1 text-xs"
                placeholder="Número de documento"
              />
            </label>
            <label className="block text-xs font-medium text-slate-700">
              Veterinario responsable
              <input
                name="veterinarianName"
                required
                minLength={2}
                maxLength={120}
                defaultValue={initialData?.veterinarianName ?? ""}
                className="vet-field mt-1 text-xs"
                placeholder="Dr. Nombre Apellido"
              />
            </label>
            <label className="block text-xs font-medium text-slate-700">
              Colegiatura profesional (CMVP)
              <input
                name="veterinarianLicense"
                required
                minLength={3}
                maxLength={40}
                defaultValue={initialData?.veterinarianLicense ?? ""}
                className="vet-field mt-1 text-xs"
                placeholder="CMVP-12345"
              />
            </label>
          </div>

          <button type="submit" disabled={pending} className="vet-button vet-button-primary text-xs">
            {pending ? "Guardando…" : "Guardar datos del establecimiento"}
          </button>
        </form>
      )}

      {result && (
        <p
          role={result.ok ? "status" : "alert"}
          className={`vet-notice mt-3 text-xs ${result.ok ? "vet-notice-info" : "vet-notice-danger"}`}
        >
          {result.message}
        </p>
      )}
    </div>
  );
}
