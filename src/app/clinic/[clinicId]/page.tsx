import Link from "next/link";
import { notFound } from "next/navigation";
import { logoutAction } from "@/app/auth/actions";
import { requireClinicMembership } from "@/lib/auth/clinic";
import { ClinicNav, Notice, PageIntro } from "@/components/vetia-ui";

export const dynamic = "force-dynamic";

export default async function ClinicHomePage({ params }: { params: Promise<{ clinicId: string }> }) {
  const { clinicId } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(clinicId)) notFound();
  const { supabase, membership } = await requireClinicMembership(clinicId);
  const { count, error } = await supabase.from("clinic_clients").select("id", { count: "exact", head: true }).eq("clinic_id", clinicId);
  return <main className="vet-shell vet-page space-y-4">
    <header className="flex flex-wrap items-center justify-between gap-2"><Link href="/clinic" className="vet-link inline-flex min-h-11 items-center">← Establecimientos</Link><form action={logoutAction}><button className="vet-button vet-button-secondary">Cerrar sesión</button></form></header>
    <PageIntro title="Panel de clínica" label={membership.role === "clinic_admin" ? "Administración de clínica" : "Personal de clínica"} />
    <ClinicNav clinicId={clinicId} current="overview" profile={membership.role === "clinic_admin"} />
    <section className="vet-card space-y-3">
      <h2 className="text-xl font-bold">Solicitudes de cita</h2>
      <p className="vet-muted">Revisa las solicitudes y confirma un horario después de coordinar con el propietario.</p>
      <Link href={`/clinic/${clinicId}/appointments`} className="vet-button vet-button-primary">Abrir solicitudes de cita</Link>
    </section>
    <section className="vet-card space-y-2">
      <h2 className="text-xl font-bold">Fichas de clientes</h2>
      {error ? <Notice tone="warning" role="status">No se pudo consultar el resumen en este momento.</Notice>
        : <p className="vet-muted">{count ?? 0} fichas registradas en esta clínica.</p>}
    </section>
  </main>;
}
