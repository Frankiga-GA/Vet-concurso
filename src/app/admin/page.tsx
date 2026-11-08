import Link from "next/link";
import { logoutAction } from "@/app/auth/actions";
import { requirePlatformAdminAal2 } from "@/lib/auth/session";
import { AdminNav, Notice, PageIntro } from "@/components/vetia-ui";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const { user } = await requirePlatformAdminAal2();
  return <main className="vet-shell vet-page space-y-4">
    <header className="flex flex-wrap items-start justify-between gap-3">
      <PageIntro title="Superadministración" label="VetIA" />
      <form action={logoutAction}><button className="vet-button vet-button-secondary">Cerrar sesión</button></form>
    </header>
    <AdminNav current="overview" />
    <section className="vet-card space-y-3">
      <h2 className="text-xl font-bold">Solicitudes de veterinarias</h2>
      <p className="vet-muted">Consulta el estado de las solicitudes y los datos de cada establecimiento.</p>
        <Link href="/admin/clinic-applications" className="vet-button vet-button-primary">
          Revisar solicitudes
        </Link>
    </section>
    <Notice><p className="font-semibold">Sesión administrativa verificada</p><p className="text-sm wrap-break-word">{user.email}</p></Notice>
  </main>;
}
