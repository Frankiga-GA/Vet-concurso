import Link from "next/link";
import { logoutAction } from "@/app/auth/actions";
import { requireAnyClinicMembership } from "@/lib/auth/clinic";
import { Brand, Notice, PageIntro } from "@/components/vetia-ui";

export const dynamic = "force-dynamic";

export default async function ClinicIndexPage() {
  const { memberships } = await requireAnyClinicMembership();
  return <main className="vet-shell vet-page space-y-4">
    <header className="flex flex-wrap items-center justify-between gap-2">
      <Brand />
      <div className="flex flex-wrap items-center gap-2">
        <Link href="/account" className="vet-button vet-button-secondary">Mi cuenta</Link>
        <form action={logoutAction}><button className="vet-button vet-button-secondary">Cerrar sesión</button></form>
      </div>
    </header>
    <PageIntro title="Espacio de veterinaria"><p>Selecciona el establecimiento en el que vas a trabajar.</p></PageIntro>
    {memberships.length === 0 ? <Notice>Esta cuenta todavía no tiene una membresía activa de clínica. Una solicitud pendiente de incorporación no da acceso operativo.</Notice>
      : <ul className="grid gap-3 sm:grid-cols-2">{memberships.map((membership) => <li key={membership.clinic_id} className="vet-card space-y-3">
        <h2 className="vet-card-title wrap-break-word">{membership.name}</h2>
        <p className="font-semibold">Acceso activo · {membership.role === "clinic_admin" ? "Administración" : "Personal"}</p>
        <Link className="vet-button vet-button-primary" href={`/clinic/${membership.clinic_id}`}>Abrir establecimiento</Link>
      </li>)}</ul>}
  </main>;
}
