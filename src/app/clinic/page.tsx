import Link from "next/link";
import { logoutAction } from "@/app/auth/actions";
import { requireAnyClinicMembership } from "@/lib/auth/clinic";
import { Brand, EmptyState, PageIntro } from "@/components/vetia-ui";

export const dynamic = "force-dynamic";

export default async function ClinicIndexPage() {
  const { memberships } = await requireAnyClinicMembership();
  return <main className="vet-shell vet-page space-y-7">
    <header className="flex flex-wrap items-center justify-between gap-2">
      <Brand />
      <div className="flex flex-wrap items-center gap-2">
        <Link href="/account" className="vet-button vet-button-secondary">Mi cuenta</Link>
        <form action={logoutAction}><button className="vet-button vet-button-secondary">Cerrar sesión</button></form>
      </div>
    </header>
    <PageIntro title="Selecciona tu clínica" label="Espacio profesional"><p>Accede a citas, clientes, pacientes y al perfil del establecimiento donde vas a trabajar.</p></PageIntro>
    {memberships.length === 0 ? <EmptyState icon="✚" title="Aún no tienes acceso operativo"><p>Una solicitud pendiente de incorporación no habilita el panel. Cuando la clínica y tu membresía estén activas, aparecerán aquí.</p><Link href="/account/clinic-applications" className="vet-button vet-button-primary">Ver mis solicitudes</Link></EmptyState>
      : <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{memberships.map((membership) => <li key={membership.clinic_id} className="vet-card vet-card-action flex flex-col space-y-4">
        <div className="flex items-start justify-between gap-3"><span className="vet-icon-tile">✚</span><span className="vet-badge">Acceso activo</span></div>
        <div><h2 className="vet-card-title wrap-break-word">{membership.name}</h2>
        <p className="vet-muted mt-1 text-sm">{membership.role === "clinic_admin" ? "Administrador de clínica" : "Personal de clínica"}</p></div>
        <Link className="vet-button vet-button-primary mt-auto" href={`/clinic/${membership.clinic_id}`}>Abrir panel →</Link>
      </li>)}</ul>}
  </main>;
}
