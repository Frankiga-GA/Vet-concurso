import Link from "next/link";
import { Suspense } from "react";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { cities, directoryProfile } from "@/features/appointments/contract";
import { EmptyState, Notice, PageIntro, PublicHeader, SiteFooter } from "@/components/vetia-ui";

export const dynamic = "force-dynamic";

export default async function DirectoryPage({
  searchParams,
}: {
  searchParams: Promise<{ ciudad?: string; servicio?: string }>;
}) {
  const filters = await searchParams;
  const city = z.enum(cities).safeParse(filters.ciudad).data ?? null;
  const service = typeof filters.servicio === "string" ? filters.servicio.trim().slice(0, 80) : "";

  const directoryUrl = (selectedCity: string | null, customService?: string) => {
    const params = new URLSearchParams();
    if (selectedCity) params.set("ciudad", selectedCity);
    const targetService = customService !== undefined ? customService : service;
    if (targetService) params.set("servicio", targetService);
    return params.size ? `/veterinarias?${params}` : "/veterinarias";
  };

  return (
    <>
      <PublicHeader current="directory" />
      <main className="vet-shell vet-page space-y-7">
        <div className="grid items-end gap-5 md:grid-cols-[1fr_auto]">
          <PageIntro title="Encuentra una veterinaria" label="Directorio VetIA">
            <p>
              Explora establecimientos aprobados para animales de compañía y animales de producción en la Región Ica.
            </p>
          </PageIntro>
          <span className="vet-kicker">Chincha · Pisco · Ica</span>
        </div>

        <section className="vet-card vet-card-elevated space-y-4" aria-label="Filtros del directorio">
          <div>
            <h2 className="vet-card-title">¿Dónde necesitas atención?</h2>
            <p className="vet-muted mt-1 text-sm">Elige una ciudad y busca por tipo de animal o servicio.</p>
          </div>

          {/* City filter */}
          <nav aria-label="Filtrar por ciudad" className="flex flex-wrap gap-2">
            {[null, ...cities].map((option) => (
              <Link
                key={option ?? "all"}
                href={directoryUrl(option)}
                aria-current={city === option ? "page" : undefined}
                className="vet-button vet-filter"
              >
                {option ?? "Todas las ciudades"}
              </Link>
            ))}
          </nav>

          {/* Quick Category Pills (Mascotas vs Producción) */}
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
            <span className="text-xs font-bold text-[var(--muted)]">Enfoque:</span>
            <Link
              href={directoryUrl(city, "")}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                !service
                  ? "bg-slate-800 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              Todos los servicios
            </Link>
            <Link
              href={directoryUrl(city, "producción")}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition flex items-center gap-1 ${
                service.toLowerCase().includes("producción") || service.toLowerCase().includes("ganad")
                  ? "bg-[var(--green)] text-white shadow-xs"
                  : "bg-emerald-100/70 text-emerald-900 border border-emerald-300 hover:bg-emerald-200"
              }`}
            >
              <span>Sanidad Aviar y Pecuaria (Agro)</span>
            </Link>
            <Link
              href={directoryUrl(city, "diagnóstico")}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                service.toLowerCase().includes("diagnóstico")
                  ? "bg-[var(--green)] text-white"
                  : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
              }`}
            >
              Diagnóstico Clínico de Campo
            </Link>
          </div>

          {/* Search Bar */}
          <form action="/veterinarias" className="grid items-end gap-3 sm:grid-cols-[1fr_auto_auto]">
            {city && <input type="hidden" name="ciudad" value={city} />}
            <label className="block min-w-0 text-sm font-semibold">
              Servicio o Especialidad
              <input
                key={service}
                name="servicio"
                type="search"
                maxLength={80}
                defaultValue={service}
                className="vet-field"
                placeholder="Ej. producción, rumiantes, bovinos, cirugía, vacunación"
              />
            </label>
            <button type="submit" className="vet-button vet-button-primary">
              Buscar
            </button>
            {service && (
              <Link href={city ? `/veterinarias?ciudad=${city}` : "/veterinarias"} className="vet-button vet-button-secondary">
                Limpiar
              </Link>
            )}
          </form>
        </section>

        <Suspense key={`${city ?? "all"}:${service}`} fallback={<Notice role="status">Buscando veterinarias…</Notice>}>
          <DirectoryResults city={city} service={service} />
        </Suspense>
      </main>
      <SiteFooter />
    </>
  );
}

async function DirectoryResults({
  city,
  service,
}: {
  city: (typeof cities)[number] | null;
  service: string;
}) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("vetia_directory_profiles", {
    p_city: city,
    p_slug: null,
    p_service: service || null,
  });
  const parsed = z.array(directoryProfile).safeParse(data);

  return error || !parsed.success ? (
    <Notice role="alert" tone="danger">
      <p>No pudimos cargar el directorio. Recarga la página para intentarlo de nuevo.</p>
    </Notice>
  ) : parsed.data.length === 0 ? (
    <EmptyState
      icon="⌕"
      title={service ? "No encontramos ese servicio" : `Aún no hay veterinarias publicadas${city ? ` en ${city}` : ""}`}
    >
      <p>
        {service
          ? "Prueba con otro término o quita el filtro para ver más resultados."
          : city
          ? "Consulta los establecimientos disponibles en las otras ciudades."
          : "Los establecimientos aprobados aparecerán aquí cuando completen su publicación."}
      </p>
      {city && (
        <Link href="/veterinarias" className="vet-button vet-button-secondary">
          Ver todas las ciudades
        </Link>
      )}
    </EmptyState>
  ) : (
    <section>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="vet-section-title">Veterinarias disponibles</h2>
        <span className="vet-badge">
          {parsed.data.length} resultado{parsed.data.length === 1 ? "" : "s"}
        </span>
      </div>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {parsed.data.map((clinic) => {
          const servesProduction = clinic.services.some((s) =>
            /producci[oó]n|ganader|rumiante|bovin|porcin|ave|pecuaria|mayor/i.test(s)
          );

          return (
            <li key={clinic.id} className="min-w-0">
              <Link
                href={`/veterinarias/${clinic.slug}`}
                aria-label={`Ver ficha de ${clinic.name}`}
                className="vet-card vet-card-action flex h-full flex-col space-y-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="vet-icon-tile" aria-hidden="true">
                    ✚
                  </span>
                  <div className="flex items-center gap-1.5">
                    {servesProduction && (
                      <span className="rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 border border-emerald-300">
                        Producción
                      </span>
                    )}
                    <span className="vet-badge">{clinic.city}</span>
                  </div>
                </div>
                <div>
                  <h3 className="vet-card-title wrap-break-word">{clinic.name}</h3>
                  <p className="vet-muted mt-1 wrap-break-word text-sm">⌖ {clinic.address}</p>
                </div>
                <ul className="flex flex-wrap gap-1.5" aria-label="Servicios principales">
                  {clinic.services.slice(0, 3).map((item) => (
                    <li key={item} className="vet-badge vet-badge-neutral">
                      {item}
                    </li>
                  ))}
                </ul>
                <span className="vet-link mt-auto inline-flex items-center pt-2">
                  Ver perfil y contacto →
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
