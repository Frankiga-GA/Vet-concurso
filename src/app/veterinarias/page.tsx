import Link from "next/link";
import { Suspense } from "react";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { cities, directoryProfile } from "@/features/appointments/contract";
import { Notice, PageIntro, PublicHeader } from "@/components/vetia-ui";

export const dynamic = "force-dynamic";

export default async function DirectoryPage({ searchParams }: { searchParams: Promise<{ ciudad?: string; servicio?: string }> }) {
  const filters = await searchParams;
  const city = z.enum(cities).safeParse(filters.ciudad).data ?? null;
  const service = typeof filters.servicio === "string" ? filters.servicio.trim().slice(0, 80) : "";
  const directoryUrl = (selectedCity: string | null) => {
    const params = new URLSearchParams();
    if (selectedCity) params.set("ciudad", selectedCity);
    if (service) params.set("servicio", service);
    return params.size ? `/veterinarias?${params}` : "/veterinarias";
  };
  return <>
    <PublicHeader current="directory" />
    <main className="vet-shell vet-page space-y-4">
      <PageIntro title="Veterinarias" label="Directorio VetIA"><p>Busca por ciudad o servicio y consulta la ficha de la clínica.</p></PageIntro>
      <nav aria-label="Filtrar por ciudad" className="flex flex-wrap gap-2">
        {[null, ...cities].map((option) => <Link key={option ?? "all"} href={directoryUrl(option)}
          aria-current={city === option ? "page" : undefined} className="vet-button vet-filter">
          {option ?? "Todas"}
        </Link>)}
      </nav>
      <form action="/veterinarias" className="flex flex-wrap items-end gap-2">
        {city && <input type="hidden" name="ciudad" value={city} />}
        <label className="block min-w-0 flex-1 text-sm font-semibold">Servicio
          <input key={service} name="servicio" type="search" maxLength={80} defaultValue={service} className="vet-field" placeholder="Ej. vacunación" />
        </label>
        <button type="submit" className="vet-button vet-button-primary">Buscar</button>
        {service && <Link href={city ? `/veterinarias?ciudad=${city}` : "/veterinarias"} className="vet-button vet-button-secondary">Quitar filtro</Link>}
      </form>
      <Suspense key={`${city ?? "all"}:${service}`} fallback={<Notice role="status">Buscando veterinarias…</Notice>}>
        <DirectoryResults city={city} service={service} />
      </Suspense>
    </main>
  </>;
}

async function DirectoryResults({ city, service }: { city: (typeof cities)[number] | null; service: string }) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("vetia_directory_profiles", { p_city: city, p_slug: null, p_service: service || null });
  const parsed = z.array(directoryProfile).safeParse(data);
  return error || !parsed.success ? <Notice role="alert" tone="danger">
        <p>No pudimos cargar el directorio. Recarga la página para intentarlo de nuevo.</p>
      </Notice>
      : parsed.data.length === 0 ? <section className="vet-card space-y-2">
        <h2 className="text-lg font-bold">{service ? "No hay clínicas que coincidan con el servicio" : `No hay veterinarias publicadas${city ? ` en ${city}` : ""}`}</h2>
        <p className="vet-muted">{service ? "Prueba otro término o quita el filtro." : city ? "Puedes consultar establecimientos de otras ciudades." : "El directorio mostrará aquí los establecimientos publicados."}</p>
        {city && <Link href="/veterinarias" className="vet-button vet-button-secondary">Ver todas las ciudades</Link>}
      </section>
      : <ul className="grid gap-3 sm:grid-cols-2">
        {parsed.data.map((clinic) => <li key={clinic.id} className="min-w-0">
          <Link href={`/veterinarias/${clinic.slug}`} className="vet-card vet-card-action h-full space-y-2">
            <span className="vet-badge">{clinic.city}</span>
            <h2 className="vet-card-title vet-link wrap-break-word">{clinic.name}</h2>
            <p className="vet-muted wrap-break-word text-sm">{clinic.address}</p>
            <p className="vet-muted wrap-break-word text-sm">{clinic.services.slice(0, 3).join(" · ")}</p>
          </Link>
        </li>)}
      </ul>;
}
