import Link from "next/link";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { cities, directoryClinic } from "@/features/appointments/contract";

export const dynamic = "force-dynamic";

export default async function DirectoryPage({ searchParams }: { searchParams: Promise<{ ciudad?: string }> }) {
  const city = z.enum(cities).safeParse((await searchParams).ciudad).data ?? null;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("vetia_public_clinics", { p_city: city, p_slug: null });
  const parsed = z.array(directoryClinic).safeParse(data);
  return <main className="mx-auto max-w-5xl px-5 py-8 sm:py-12">
    <Link href="/" className="text-sm font-semibold text-emerald-800">Volver a VetIA</Link>
    <h1 className="mt-5 text-3xl font-semibold">Veterinarias</h1>
    <p className="mt-2 text-slate-600">Encuentra un establecimiento y solicita una cita para coordinar con la clínica.</p>
    <nav aria-label="Filtrar por ciudad" className="mt-5 flex flex-wrap gap-2">
      {[null, ...cities].map((option) => <Link key={option ?? "all"} href={option ? `/veterinarias?ciudad=${option}` : "/veterinarias"}
        aria-current={city === option ? "page" : undefined} className={`rounded-full border border-emerald-800 px-4 py-2 text-sm font-semibold ${city === option ? "bg-emerald-800 text-white" : "text-emerald-900"}`}>
        {option ?? "Todas"}
      </Link>)}
    </nav>
    {error || !parsed.success ? <p role="alert" className="mt-6 text-rose-800">No pudimos cargar el directorio. Intenta de nuevo.</p>
      : parsed.data.length === 0 ? <p className="mt-6 text-slate-600">No hay veterinarias publicadas para esta selección.</p>
      : <ul className="mt-6 grid gap-4 sm:grid-cols-2">
        {parsed.data.map((clinic) => <li key={clinic.id} className="min-w-0 rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="text-xl font-semibold wrap-break-word"><Link href={`/veterinarias/${clinic.slug}`} className="text-emerald-800 underline">{clinic.name}</Link></h2>
          <p className="mt-2 text-sm wrap-break-word text-slate-600">{clinic.city} · {clinic.address}</p>
        </li>)}
      </ul>}
  </main>;
}
