"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import type { SearchResult } from "./contract";

export function ClinicClientSearch({ clinicId, initial, action }: {
  clinicId: string;
  initial: SearchResult;
  action: (previous: SearchResult, form: FormData) => Promise<SearchResult>;
}) {
  const [state, submit, pending] = useActionState(action, initial);
  const [query, setQuery] = useState("");
  return <>
    <form action={submit} aria-busy={pending} className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end">
      <label className="block text-sm font-medium">Nombre, teléfono, correo o nombre del paciente
        <input name="query" type="search" maxLength={120} autoComplete="off" value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="vet-field" />
      </label>
      <button disabled={pending} className="vet-button vet-button-primary">
        {pending ? "Buscando…" : "Buscar"}
      </button>
    </form>
    <div className="mt-4" aria-live="polite">
      {state.message ? <p role="alert">{state.message}</p>
        : state.rows.length === 0 ? <p>No encontramos clientes para esta búsqueda.</p>
        : <ul className="divide-y divide-slate-200">
          {state.rows.slice(0, 50).map((row) => <li key={row.id}>
            <Link href={`/clinic/${clinicId}/clients/${row.id}`} className="block min-h-11 py-3 wrap-break-word">
              <span className="font-semibold text-emerald-900 underline">{row.full_name}</span>
              <span className="block text-sm text-slate-700">{row.phone}</span>
            </Link>
          </li>)}
        </ul>}
      {state.rows.length > 50 && <p className="mt-2 text-sm">Se muestran los primeros 50 resultados. Refina tu búsqueda.</p>}
    </div>
  </>;
}
