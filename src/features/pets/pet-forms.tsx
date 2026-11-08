"use client";

import { useRef, useState, useTransition, type FormEvent, type ReactNode } from "react";
import { createPet, saveOwner, type PetFormResult } from "@/app/account/pets/actions";

const inputClass = "vet-field";

function SubmitForm({ action, label, clearOnSuccess = false, children }: {
  action: (data: FormData) => Promise<PetFormResult>;
  label: string;
  clearOnSuccess?: boolean;
  children: ReactNode;
}) {
  const [result, setResult] = useState<PetFormResult | null>(null);
  const [pending, startTransition] = useTransition();
  const submitting = useRef(false);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current || pending) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    submitting.current = true;
    setResult(null);
    startTransition(async () => {
      try {
        const response = await action(data);
        if (clearOnSuccess && response.status === "success") form.reset();
        setResult(response);
      } catch {
        setResult({ status: "error", message: "No pudimos confirmar el envío. Recarga el panel y revisa el resultado antes de volver a intentarlo." });
      } finally {
        submitting.current = false;
      }
    });
  }

  return <form method="post" onSubmit={submit} aria-busy={pending} className="mt-5">
    <fieldset disabled={pending} className="space-y-4">
      {children}
      <button type="submit" className="vet-button vet-button-primary">
        {pending ? "Guardando…" : label}
      </button>
    </fieldset>
    {result && <p role={result.status === "error" ? "alert" : "status"} className={`mt-3 text-sm ${result.status === "error" ? "text-red-800" : "text-emerald-800"}`}>
      {result.message}
    </p>}
  </form>;
}

export function OwnerForm() {
  return <SubmitForm action={saveOwner} label="Guardar perfil">
    <label className="block text-sm font-medium">
      Nombre completo
      <input className={inputClass} name="fullName" autoComplete="name" required minLength={2} maxLength={180} />
    </label>
    <label className="block text-sm font-medium">
      Teléfono (opcional)
      <input className={inputClass} name="phone" type="tel" autoComplete="tel" maxLength={32} />
    </label>
  </SubmitForm>;
}

export function PetForm({ today }: { today: string }) {
  return <SubmitForm action={createPet} label="Registrar mascota" clearOnSuccess>
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="block text-sm font-medium">
        Nombre
        <input className={inputClass} name="name" required maxLength={120} />
      </label>
      <label className="block text-sm font-medium">
        Especie
        <input className={inputClass} name="species" required minLength={2} maxLength={60} placeholder="Ej. perro" />
      </label>
      <label className="block text-sm font-medium">
        Raza (opcional)
        <input className={inputClass} name="breed" maxLength={120} />
      </label>
      <label className="block text-sm font-medium">
        Sexo (opcional)
        <select className={inputClass} name="sex">
          <option value="">Sin especificar</option>
          <option>Hembra</option>
          <option>Macho</option>
        </select>
      </label>
      <label className="block text-sm font-medium">
        Fecha de nacimiento (opcional)
        <input className={inputClass} name="birthDate" type="date" max={today} />
      </label>
    </div>
  </SubmitForm>;
}
