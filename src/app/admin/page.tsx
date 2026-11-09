import Link from "next/link";
import { logoutAction } from "@/app/auth/actions";
import { requirePlatformAdminAal2 } from "@/lib/auth/session";
import { AdminNav, Notice, PageIntro } from "@/components/vetia-ui";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const { user } = await requirePlatformAdminAal2();
  return <main className="vet-shell vet-page space-y-7">
    <header className="flex flex-wrap items-start justify-between gap-3">
      <PageIntro title="Centro de control" label="Superadministración VetIA"><p>Revisa incorporaciones, seguridad y operaciones de la red.</p></PageIntro>
      <form action={logoutAction}><button className="vet-button vet-button-secondary">Cerrar sesión</button></form>
    </header>
    <AdminNav current="overview" />
    <div className="grid gap-4 sm:grid-cols-3">
      <div className="vet-stat"><span className="vet-muted text-sm">Acceso</span><span className="vet-stat-value text-lg">AAL2 activo</span></div>
      <div className="vet-stat"><span className="vet-muted text-sm">Decisiones</span><span className="vet-stat-value text-lg">Controladas</span></div>
      <div className="vet-stat"><span className="vet-muted text-sm">Auditoría</span><span className="vet-stat-value text-lg">Habilitada</span></div>
    </div>
    <section className="vet-card vet-card-elevated space-y-3">
      <span className="vet-icon-tile">▤</span><h2 className="vet-section-title">Solicitudes de veterinarias</h2>
      <p className="vet-muted">Consulta cada incorporación, revisa sus datos y continúa el proceso autorizado.</p>
        <Link href="/admin/clinic-applications" className="vet-button vet-button-primary">
          Abrir bandeja de solicitudes
        </Link>
    </section>
    <Notice><p className="font-semibold">Sesión administrativa protegida</p><p className="text-sm wrap-break-word">Autenticación reforzada activa · {user.email}</p></Notice>
  </main>;
}
