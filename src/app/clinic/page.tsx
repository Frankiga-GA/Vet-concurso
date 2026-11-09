import Link from "next/link";
import { logoutAction } from "@/app/auth/actions";
import { requireAnyClinicMembership } from "@/lib/auth/clinic";
import { Brand, EmptyState, PageIntro } from "@/components/vetia-ui";

export const dynamic = "force-dynamic";

export default async function ClinicIndexPage() {
  const { memberships } = await requireAnyClinicMembership();
  return (
    <main className="vet-shell vet-page space-y-7">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <Brand />
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/account" className="vet-button vet-button-secondary">Mi cuenta</Link>
          <form action={logoutAction}><button className="vet-button vet-button-secondary">Cerrar sesión</button></form>
        </div>
      </header>
      <PageIntro title="Selecciona tu clínica" label="Espacio profesional">
        <p>Accede a citas, clientes, pacientes y al perfil del establecimiento donde vas a trabajar.</p>
      </PageIntro>
      {memberships.length === 0 ? (
        <EmptyState icon="🛡️" title="Aún no tienes acceso operativo a ninguna clínica">
          <p className="max-w-md mx-auto text-sm text-slate-600">
            Una cuenta normal no puede crear ni administrar veterinarias directamente. El envío de una solicitud no concede acceso operativo ni publica la clínica: requiere aportar documentos de personería y ser verificada, aprobada y activada por el superadministrador.
          </p>
          <div className="flex flex-wrap justify-center gap-3 mt-4">
            <Link href="/account/clinic-applications" className="vet-button vet-button-primary">
              Solicitar incorporación de mi clínica
            </Link>
            <Link href="/account" className="vet-button vet-button-secondary">
              Ir a mi cuenta
            </Link>
          </div>
        </EmptyState>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {memberships.map((membership) => (
            <li key={membership.clinic_id} className="vet-card vet-card-action flex flex-col space-y-4">
              <div className="flex items-start justify-between gap-3">
                <span className="vet-icon-tile">✚</span>
                <span className="vet-badge">Acceso activo</span>
              </div>
              <div>
                <h2 className="vet-card-title wrap-break-word">{membership.name}</h2>
                <p className="vet-muted mt-1 text-sm">
                  {membership.role === "clinic_admin" ? "Administrador de clínica" : "Personal de clínica"}
                </p>
              </div>
              <Link className="vet-button vet-button-primary mt-auto" href={`/clinic/${membership.clinic_id}`}>
                Abrir panel →
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
