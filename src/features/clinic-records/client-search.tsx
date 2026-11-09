"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import type { SearchResult } from "./contract";

export function ClinicClientSearch({ clinicId, initial, action }: {
  clinicId: string;
  initial: SearchResult;
  action: (previous: SearchResult, form: FormData) => Promise<SearchResult>;
}) {
  const [query, setQuery] = useState("");
  const [searched, setSearched] = useState(false);
  const [state, submit, pending] = useActionState(async (previous: SearchResult, form: FormData) => {
    const clear = form.get("intent") === "clear";
    if (clear) setQuery("");
    setSearched(!clear && Boolean(String(form.get("query") ?? "").trim()));
    return action(previous, form);
  }, initial);
  return <>
    <form action={submit} aria-busy={pending} className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end">
      <label className="block text-sm font-medium">Nombre, teléfono, correo o nombre del paciente
        <input name="query" type="search" maxLength={120} autoComplete="off" value={query} readOnly={pending}
          onChange={(event) => setQuery(event.target.value)}
          className="vet-field" />
      </label>
      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={pending} className="vet-button vet-button-primary">
          {pending ? "Buscando…" : "Buscar"}
        </button>
        {(searched || query) && <button type="submit" name="intent" value="clear" disabled={pending}
          className="vet-button vet-button-secondary">
          Ver todos
        </button>}
      </div>
    </form>
    <div className="mt-4" aria-live="polite">
      {state.message ? <p role="alert" className="vet-notice vet-notice-danger">{state.message}</p>
        : state.rows.length === 0 ? <p className="vet-notice vet-notice-info">{searched ? "No encontramos clientes para esta búsqueda." : "Todavía no hay clientes registrados."}</p>
        : <ul className="grid gap-3 sm:grid-cols-2">
          {state.rows.slice(0, 50).map((row) => <li key={row.id}>
            <Link href={`/clinic/${clinicId}/clients/${row.id}`} className="vet-card vet-card-action flex min-h-24 items-center gap-3 p-4 wrap-break-word">
              <span className="vet-icon-tile" aria-hidden="true">◉</span>
              <span className="min-w-0"><span className="block font-semibold text-[var(--brand)]">{row.full_name}</span>
              <span className="block text-sm text-[var(--muted)]">{row.phone}</span></span>
            </Link>
          </li>)}
        </ul>}
      {state.rows.length > 50 && <p className="mt-2 text-sm">Se muestran los primeros 50 resultados. Refina tu búsqueda.</p>}
    </div>
  </>;
}
