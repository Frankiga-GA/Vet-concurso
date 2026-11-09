import Link from "next/link";
import { Suspense } from "react";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { cities, directoryProfile } from "@/features/appointments/contract";
import { EmptyState, Notice, PageIntro, PublicHeader, SiteFooter } from "@/components/vetia-ui";

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
    <main className="vet-shell vet-page space-y-7">
      <div className="grid items-end gap-5 md:grid-cols-[1fr_auto]">
        <PageIntro title="Encuentra una veterinaria" label="Directorio VetIA"><p>Explora establecimientos aprobados, conoce sus servicios y contacta directamente para coordinar la atención.</p></PageIntro>
        <span className="vet-kicker">Chincha · Pisco · Ica</span>
      </div>
      <section className="vet-card vet-card-elevated space-y-4" aria-label="Filtros del directorio">
        <div><h2 className="vet-card-title">¿Dónde necesitas atención?</h2><p className="vet-muted mt-1 text-sm">Elige una ciudad y busca el servicio que necesitas.</p></div>
        <nav aria-label="Filtrar por ciudad" className="flex flex-wrap gap-2">
          {[null, ...cities].map((option) => <Link key={option ?? "all"} href={directoryUrl(option)}
            aria-current={city === option ? "page" : undefined} className="vet-button vet-filter">
            {option ?? "Todas las ciudades"}
          </Link>)}
        </nav>
        <form action="/veterinarias" className="grid items-end gap-3 sm:grid-cols-[1fr_auto_auto]">
          {city && <input type="hidden" name="ciudad" value={city} />}
          <label className="block min-w-0 text-sm font-semibold">Servicio
            <input key={service} name="servicio" type="search" maxLength={80} defaultValue={service} className="vet-field" placeholder="Ej. vacunación, consulta, cirugía" />
          </label>
          <button type="submit" className="vet-button vet-button-primary">Buscar</button>
          {service && <Link href={city ? `/veterinarias?ciudad=${city}` : "/veterinarias"} className="vet-button vet-button-secondary">Limpiar</Link>}
        </form>
      </section>
      <Suspense key={`${city ?? "all"}:${service}`} fallback={<Notice role="status">Buscando veterinarias…</Notice>}>
        <DirectoryResults city={city} service={service} />
      </Suspense>
    </main>
    <SiteFooter />
  </>;
}

async function DirectoryResults({ city, service }: { city: (typeof cities)[number] | null; service: string }) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("vetia_directory_profiles", { p_city: city, p_slug: null, p_service: service || null });
  const parsed = z.array(directoryProfile).safeParse(data);
  return error || !parsed.success ? <Notice role="alert" tone="danger">
        <p>No pudimos cargar el directorio. Recarga la página para intentarlo de nuevo.</p>
      </Notice>
      : parsed.data.length === 0 ? <EmptyState icon="⌕" title={service ? "No encontramos ese servicio" : `Aún no hay veterinarias publicadas${city ? ` en ${city}` : ""}`}>
        <p>{service ? "Prueba con otro término o quita el filtro para ver más resultados." : city ? "Consulta los establecimientos disponibles en las otras ciudades." : "Los establecimientos aprobados aparecerán aquí cuando completen su publicación."}</p>
        {city && <Link href="/veterinarias" className="vet-button vet-button-secondary">Ver todas las ciudades</Link>}
      </EmptyState>
      : <section><div className="mb-4 flex items-center justify-between gap-3"><h2 className="vet-section-title">Veterinarias disponibles</h2><span className="vet-badge">{parsed.data.length} resultado{parsed.data.length === 1 ? "" : "s"}</span></div><ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {parsed.data.map((clinic) => <li key={clinic.id} className="min-w-0">
          <Link href={`/veterinarias/${clinic.slug}`} aria-label={`Ver ficha de ${clinic.name}`} className="vet-card vet-card-action flex h-full flex-col space-y-3">
            <div className="flex items-center justify-between gap-3"><span className="vet-icon-tile" aria-hidden="true">✚</span><span className="vet-badge">{clinic.city}</span></div>
            <div><h3 className="vet-card-title wrap-break-word">{clinic.name}</h3><p className="vet-muted mt-1 wrap-break-word text-sm">⌖ {clinic.address}</p></div>
            <ul className="flex flex-wrap gap-1.5" aria-label="Servicios principales">{clinic.services.slice(0, 3).map((item) => <li key={item} className="vet-badge vet-badge-neutral">{item}</li>)}</ul>
            <span className="vet-link mt-auto inline-flex items-center pt-2">Ver perfil y contacto →</span>
          </Link>
        </li>)}
      </ul></section>;
}
