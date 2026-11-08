import Link from "next/link";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { cities, directoryClinic } from "@/features/appointments/contract";
import { Notice, PageIntro, PublicHeader } from "@/components/vetia-ui";

export const dynamic = "force-dynamic";

export default async function DirectoryPage({ searchParams }: { searchParams: Promise<{ ciudad?: string }> }) {
  const city = z.enum(cities).safeParse((await searchParams).ciudad).data ?? null;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("vetia_public_clinics", { p_city: city, p_slug: null });
  const parsed = z.array(directoryClinic).safeParse(data);
  return <>
    <PublicHeader current="directory" />
    <main className="vet-shell vet-page space-y-5">
    <PageIntro title="Veterinarias" label="Directorio VetIA"><p>Elige una ciudad y consulta la ficha de la clínica para coordinar la atención.</p></PageIntro>
    <nav aria-label="Filtrar por ciudad" className="flex flex-wrap gap-2">
      {[null, ...cities].map((option) => <Link key={option ?? "all"} href={option ? `/veterinarias?ciudad=${option}` : "/veterinarias"}
        aria-current={city === option ? "page" : undefined} className="vet-button vet-filter">
        {option ?? "Todas"}
      </Link>)}
    </nav>
    {error || !parsed.success ? <Notice role="alert" tone="danger">
        <p>No pudimos cargar el directorio. Recarga la página para intentarlo de nuevo.</p>
      </Notice>
      : parsed.data.length === 0 ? <section className="vet-card space-y-2">
        <h2 className="text-lg font-bold">No hay veterinarias publicadas{city ? ` en ${city}` : ""}</h2>
        <p className="vet-muted">{city ? "Puedes consultar establecimientos de otras ciudades." : "El directorio mostrará aquí los establecimientos publicados."}</p>
        {city && <Link href="/veterinarias" className="vet-button vet-button-secondary">Ver todas las ciudades</Link>}
      </section>
      : <ul className="grid gap-4 sm:grid-cols-2">
        {parsed.data.map((clinic) => <li key={clinic.id} className="vet-card space-y-3">
          <span className="vet-badge">{clinic.city}</span>
          <h2 className="text-xl font-bold wrap-break-word">{clinic.name}</h2>
          <p className="vet-muted wrap-break-word">{clinic.address}</p>
          <Link href={`/veterinarias/${clinic.slug}`} className="vet-button vet-button-secondary" aria-label={`Ver ficha de ${clinic.name}`}>Ver ficha</Link>
        </li>)}
      </ul>}
    </main>
  </>;
}
