import { randomUUID } from "node:crypto";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { directoryProfile } from "@/features/appointments/contract";
import { days } from "@/features/clinic-profile/contract";
import { challengeAction, intakeConfig } from "@/features/appointments/intake-security";
import { RequestForm } from "@/features/appointments/request-form";
import { Notice, PageIntro, PublicHeader } from "@/components/vetia-ui";

export const dynamic = "force-dynamic";

export default async function ClinicProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 200) notFound();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("vetia_directory_profiles", { p_city: null, p_slug: slug, p_service: null });
  if (error) return <><PublicHeader current="directory" /><main className="vet-shell vet-page vet-narrow space-y-3">
    <Notice role="alert" tone="danger">No pudimos cargar esta veterinaria. Intenta de nuevo.</Notice>
    <Link href="/veterinarias" className="vet-link">Volver al directorio</Link>
  </main></>;
  const clinic = directoryProfile.safeParse(Array.isArray(data) ? data[0] : null);
  if (!clinic.success) notFound();
  const config = intakeConfig();
  const dial = clinic.data.phone?.replace(/[^0-9+]/g, "") ?? "";
  return <><PublicHeader current="directory" /><main className="vet-shell vet-page vet-narrow space-y-4">
    <Link href="/veterinarias" className="vet-link inline-flex min-h-11 items-center">← Volver al directorio</Link>
    <section className="vet-card space-y-3">
      <PageIntro title={clinic.data.name} label={clinic.data.city}><p className="wrap-break-word">{clinic.data.address}</p></PageIntro>
      <p className="wrap-break-word">Teléfono: {clinic.data.phone}</p>
      {clinic.data.description && <p className="vet-muted wrap-break-word">{clinic.data.description}</p>}
      <div className="flex flex-wrap gap-2">
        {config && <a href="#appointment" className="vet-button vet-button-primary">Solicitar cita</a>}
        {/^[+]?[0-9]{6,15}$/.test(dial) && <a href={`tel:${dial}`} className={`vet-button ${config ? "vet-button-secondary" : "vet-button-primary"}`}>Llamar a la veterinaria</a>}
      </div>
    </section>
    <section className="vet-card space-y-3">
      <h2 className="vet-card-title">Servicios y horarios</h2>
      <ul className="flex flex-wrap gap-2" aria-label="Servicios">
        {clinic.data.services.map((service) => <li className="vet-badge wrap-break-word" key={service}>{service}</li>)}
      </ul>
      <ul className="space-y-1 text-sm" aria-label="Horarios declarados">
        {clinic.data.hours.map(({ day, start, end }) => <li key={`${day}:${start}`}>{days[day - 1]} · {start} a {end}</li>)}
      </ul>
      <p className="vet-muted text-sm">Horario informativo. Confirma la disponibilidad con la clínica.</p>
    </section>
    <section className="vet-card" aria-labelledby="appointment">
      <h2 id="appointment" className="text-xl font-bold">Solicitar cita</h2>
      {config && <p className="vet-muted mt-2">Indica tu horario preferido. La clínica te contactará para coordinar.</p>}
      {config ? <RequestForm clinicId={clinic.data.id} requestKey={randomUUID()} siteKey={config.siteKey} challengeAction={challengeAction} />
        : <div className="mt-3"><Notice tone="warning">El envío en línea no está disponible en este momento. Puedes contactar a la veterinaria por teléfono.</Notice></div>}
    </section>
  </main></>;
}
