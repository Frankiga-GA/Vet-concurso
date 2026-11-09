"use client";

import { useRef, useState, useTransition, type FormEvent } from "react";
import { saveMyProfile } from "@/app/account/profile/actions";

export function ProfileForm({
  profile,
}: {
  profile: {
    first_name: string | null;
    last_name: string | null;
    phone: string | null;
    city: string | null;
    account_type?: string | null;
  } | null;
}) {
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [selectedModality, setSelectedModality] = useState<"mascotas" | "agro">(
    profile?.account_type === "agro" ? "agro" : "mascotas"
  );
  const [pending, startTransition] = useTransition();
  const sending = useRef(false);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending.current || pending) return;
    sending.current = true;
    setResult(null);
    const data = new FormData(event.currentTarget);
    startTransition(async () => {
      try {
        setResult(await saveMyProfile(data));
      } catch {
        setResult({
          ok: false,
          message: "No pudimos confirmar el guardado. Inténtalo nuevamente.",
        });
      } finally {
        sending.current = false;
      }
    });
  }

  return (
    <form onSubmit={submit} aria-busy={pending} className="mt-5 space-y-6">
      {/* Modalidad de la cuenta */}
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-bold text-[var(--ink)]">
            Enfoque principal de tu cuenta
          </label>
          <p className="text-xs text-[var(--muted)] mt-0.5">
            Define qué panel se abrirá de forma predeterminada al ingresar. Cambiarlo no borra tus mascotas ni tus predios pecuarios.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {/* Opción Mascotas */}
          <label
            className={`flex cursor-pointer items-start gap-3 rounded-xl border-2 p-3.5 transition ${
              selectedModality === "mascotas"
                ? "border-[var(--green)] bg-emerald-50/70 shadow-xs"
                : "border-slate-200 bg-white hover:border-slate-300"
            }`}
          >
            <input
              type="radio"
              name="accountType"
              value="mascotas"
              checked={selectedModality === "mascotas"}
              onChange={() => setSelectedModality("mascotas")}
              className="mt-1"
            />
            <div className="text-xs">
              <span className="font-extrabold text-[var(--ink)] block text-sm">
                🐾 Mascotas Familiares
              </span>
              <span className="text-[var(--muted)] mt-0.5 block">
                Fichas clínicas de perros y gatos, cuidados y citas veterinarias.
              </span>
            </div>
          </label>

          {/* Opción Agropecuario */}
          <label
            className={`flex cursor-pointer items-start gap-3 rounded-xl border-2 p-3.5 transition ${
              selectedModality === "agro"
                ? "border-[var(--green)] bg-emerald-50/70 shadow-xs"
                : "border-slate-200 bg-white hover:border-slate-300"
            }`}
          >
            <input
              type="radio"
              name="accountType"
              value="agro"
              checked={selectedModality === "agro"}
              onChange={() => setSelectedModality("agro")}
              className="mt-1"
            />
            <div className="text-xs">
              <span className="font-extrabold text-[var(--ink)] block text-sm">
                🌾 VetIA Agropecuario
              </span>
              <span className="text-[var(--muted)] mt-0.5 block">
                Predios, lotes sanitarios de ganado o aves y alertas SENASA.
              </span>
            </div>
          </label>
        </div>
      </div>

      {/* Datos Personales */}
      <fieldset disabled={pending} className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium">
          Nombres
          <input
            className="vet-field mt-1"
            name="firstName"
            autoComplete="given-name"
            required
            minLength={2}
            maxLength={80}
            defaultValue={profile?.first_name ?? ""}
          />
        </label>
        <label className="block text-sm font-medium">
          Apellidos
          <input
            className="vet-field mt-1"
            name="lastName"
            autoComplete="family-name"
            required
            minLength={2}
            maxLength={120}
            defaultValue={profile?.last_name ?? ""}
          />
        </label>
        <label className="block text-sm font-medium">
          Teléfono (opcional)
          <input
            className="vet-field mt-1"
            name="phone"
            type="tel"
            autoComplete="tel"
            maxLength={32}
            defaultValue={profile?.phone ?? ""}
          />
        </label>
        <label className="block text-sm font-medium">
          Ciudad
          <select
            className="vet-field mt-1"
            name="city"
            required
            defaultValue={profile?.city ?? ""}
          >
            <option value="" disabled>
              Selecciona una ciudad
            </option>
            <option>Chincha</option>
            <option>Pisco</option>
            <option>Ica</option>
          </select>
        </label>
      </fieldset>

      <button className="vet-button vet-button-primary" type="submit">
        {pending ? "Guardando…" : "Guardar perfil"}
      </button>

      {result && (
        <p
          role={result.ok ? "status" : "alert"}
          className={`vet-notice text-sm ${result.ok ? "vet-notice-info" : "vet-notice-danger"}`}
        >
          {result.message}
        </p>
      )}
    </form>
  );
}
