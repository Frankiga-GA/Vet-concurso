import { randomUUID } from "node:crypto";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { directoryProfile } from "@/features/appointments/contract";
import { days } from "@/features/clinic-profile/contract";
import { createIntakeToken, intakeConfig } from "@/features/appointments/intake-security";
import { RequestForm } from "@/features/appointments/request-form";
import { Notice, PageIntro, PublicHeader, SiteFooter } from "@/components/vetia-ui";

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
  const intakeToken = config ? createIntakeToken(config.intakeKey, clinic.data.id) : "";
  return <><PublicHeader current="directory" /><main className="vet-shell vet-page space-y-6">
    <Link href="/veterinarias" className="vet-link inline-flex min-h-11 items-center">← Volver al directorio</Link>
    <section className="vet-hero grid items-center gap-6 md:grid-cols-[1fr_auto]">
      <div>
        <span className="vet-kicker">✓ Veterinaria verificada · {clinic.data.city}</span>
        <div className="mt-4"><PageIntro title={clinic.data.name}><p className="wrap-break-word">⌖ {clinic.data.address}</p></PageIntro></div>
        {clinic.data.description && <p className="vet-hero-copy mt-4 wrap-break-word">{clinic.data.description}</p>}
        <div className="mt-6 flex flex-wrap gap-3">
          {config && <a href="#appointment" className="vet-button vet-button-primary">Solicitar cita</a>}
          {/^[+]?[0-9]{6,15}$/.test(dial) && <a href={`tel:${dial}`} className={`vet-button ${config ? "vet-button-secondary" : "vet-button-primary"}`}>Llamar · {clinic.data.phone}</a>}
        </div>
      </div>
      <div className="vet-orbit" aria-hidden="true">✚</div>
    </section>
    <div className="grid items-start gap-5 lg:grid-cols-[.85fr_1.15fr]">
      <div className="grid gap-5">
        <section className="vet-card space-y-4">
          <div><p className="vet-eyebrow">Atención</p><h2 className="vet-section-title mt-1">Servicios</h2></div>
          <ul className="flex flex-wrap gap-2" aria-label="Servicios">
            {clinic.data.services.map((service) => <li className="vet-badge wrap-break-word" key={service}>{service}</li>)}
          </ul>
        </section>
        <section className="vet-card space-y-4">
          <div><p className="vet-eyebrow">Horario declarado</p><h2 className="vet-section-title mt-1">Cuándo atienden</h2></div>
          <ul className="grid gap-2 text-sm" aria-label="Horarios declarados">
            {clinic.data.hours.map(({ day, start, end }) => <li className="flex justify-between gap-4 rounded-xl bg-[var(--paper)] px-3 py-2" key={`${day}:${start}`}><strong>{days[day - 1]}</strong><span>{start} – {end}</span></li>)}
          </ul>
          <p className="vet-muted text-xs">Horario informativo. Confirma la disponibilidad con la clínica.</p>
        </section>
      </div>
      <section className="vet-card vet-card-elevated" aria-labelledby="appointment">
        <span className="vet-kicker">Solicitud en línea</span><h2 id="appointment" className="vet-section-title mt-3">Solicitar una cita</h2>
        {config && <p className="vet-muted mt-2">Indica una fecha preferida. La clínica te contactará para acordar el horario definitivo.</p>}
        {config ? <RequestForm clinicId={clinic.data.id} requestKey={randomUUID()} intakeToken={intakeToken} />
          : <div className="mt-4 space-y-3"><Notice tone="warning"><strong>Solicitudes en línea próximamente.</strong><span>Puedes comunicarte directamente con la veterinaria para coordinar tu atención.</span></Notice>
            {/^[+]?[0-9]{6,15}$/.test(dial) && <a href={`tel:${dial}`} className="vet-button vet-button-primary">Llamar a la veterinaria</a>}</div>}
      </section>
    </div>
  </main><SiteFooter /></>;
}
