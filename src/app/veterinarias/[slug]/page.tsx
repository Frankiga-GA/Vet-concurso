import { randomUUID } from "node:crypto";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { directoryClinic } from "@/features/appointments/contract";
import { challengeAction, intakeConfig } from "@/features/appointments/intake-security";
import { RequestForm } from "@/features/appointments/request-form";

export const dynamic = "force-dynamic";

export default async function ClinicProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 200) notFound();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("vetia_public_clinics", { p_city: null, p_slug: slug });
  if (error) return <main className="mx-auto max-w-xl px-5 py-8">
    <p role="alert">No pudimos cargar esta veterinaria. Intenta de nuevo.</p>
    <Link href="/veterinarias" className="underline">Volver al directorio</Link>
  </main>;
  const clinic = directoryClinic.safeParse(Array.isArray(data) ? data[0] : null);
  if (!clinic.success) notFound();
  const config = intakeConfig();
  return <main className="mx-auto max-w-2xl px-5 py-8 sm:py-12">
    <Link href="/veterinarias" className="text-sm font-semibold text-emerald-800">Volver al directorio</Link>
    <h1 className="mt-5 text-3xl font-semibold wrap-break-word">{clinic.data.name}</h1>
    <p className="mt-2 wrap-break-word">{clinic.data.city} · {clinic.data.address}</p>
    <p className="mt-1 wrap-break-word">Teléfono: {clinic.data.phone}</p>
    {clinic.data.description && <p className="mt-2 wrap-break-word text-slate-600">{clinic.data.description}</p>}
    <section className="mt-6 rounded-3xl bg-white p-4 shadow-sm sm:p-8" aria-labelledby="appointment">
      <h2 id="appointment" className="text-xl font-semibold">Solicitar cita</h2>
      {config ? <RequestForm clinicId={clinic.data.id} requestKey={randomUUID()} siteKey={config.siteKey} challengeAction={challengeAction} />
        : <p className="mt-2 text-slate-600">El envío en línea no está disponible en este momento. Puedes contactar a la veterinaria por teléfono.</p>}
    </section>
  </main>;
}
