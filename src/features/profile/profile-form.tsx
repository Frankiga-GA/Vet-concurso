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
      <input type="hidden" name="accountType" value="agro" />
      <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5">
        <div className="flex items-center gap-2">
          <span className="text-lg">🌾</span>
          <div>
            <span className="font-extrabold text-[var(--ink)] block text-sm">
              IAVET Agropecuario
            </span>
            <span className="text-[var(--muted)] text-xs block">
              Predios, galpones y lotes sanitarios de aves y ganado con parámetros SENASA.
            </span>
          </div>
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
