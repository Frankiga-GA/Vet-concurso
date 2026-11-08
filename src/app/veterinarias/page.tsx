import Link from "next/link";
import { Suspense } from "react";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { cities, directoryClinic } from "@/features/appointments/contract";
import { Notice, PageIntro, PublicHeader } from "@/components/vetia-ui";

export const dynamic = "force-dynamic";

export default async function DirectoryPage({ searchParams }: { searchParams: Promise<{ ciudad?: string }> }) {
  const city = z.enum(cities).safeParse((await searchParams).ciudad).data ?? null;
  return <>
    <PublicHeader current="directory" />
    <main className="vet-shell vet-page space-y-4">
      <PageIntro title="Veterinarias" label="Directorio VetIA"><p>Filtra por ciudad para encontrar una clínica y consultar su ficha.</p></PageIntro>
      <nav aria-label="Filtrar por ciudad" className="flex flex-wrap gap-2">
        {[null, ...cities].map((option) => <Link key={option ?? "all"} href={option ? `/veterinarias?ciudad=${option}` : "/veterinarias"}
          aria-current={city === option ? "page" : undefined} className="vet-button vet-filter">
          {option ?? "Todas"}
        </Link>)}
      </nav>
      <Suspense key={city ?? "all"} fallback={<Notice role="status">Buscando veterinarias…</Notice>}>
        <DirectoryResults city={city} />
      </Suspense>
    </main>
  </>;
}

async function DirectoryResults({ city }: { city: (typeof cities)[number] | null }) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("vetia_public_clinics", { p_city: city, p_slug: null });
  const parsed = z.array(directoryClinic).safeParse(data);
  return error || !parsed.success ? <Notice role="alert" tone="danger">
        <p>No pudimos cargar el directorio. Recarga la página para intentarlo de nuevo.</p>
      </Notice>
      : parsed.data.length === 0 ? <section className="vet-card space-y-2">
        <h2 className="text-lg font-bold">No hay veterinarias publicadas{city ? ` en ${city}` : ""}</h2>
        <p className="vet-muted">{city ? "Puedes consultar establecimientos de otras ciudades." : "El directorio mostrará aquí los establecimientos publicados."}</p>
        {city && <Link href="/veterinarias" className="vet-button vet-button-secondary">Ver todas las ciudades</Link>}
      </section>
      : <ul className="grid gap-3 sm:grid-cols-2">
        {parsed.data.map((clinic) => <li key={clinic.id} className="min-w-0">
          <Link href={`/veterinarias/${clinic.slug}`} className="vet-card vet-card-action h-full space-y-2">
            <span className="vet-badge">{clinic.city}</span>
            <h2 className="vet-card-title vet-link wrap-break-word">{clinic.name}</h2>
            <p className="vet-muted wrap-break-word text-sm">{clinic.address}</p>
          </Link>
        </li>)}
      </ul>;
}
