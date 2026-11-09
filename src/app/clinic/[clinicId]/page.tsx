import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { logoutAction } from "@/app/auth/actions";
import { requireClinicMembership } from "@/lib/auth/clinic";
import { ClinicNav, Notice, PageIntro } from "@/components/vetia-ui";

export const dynamic = "force-dynamic";

async function ClientCount({ clinicId, supabase }: {
  clinicId: string;
  supabase: Awaited<ReturnType<typeof requireClinicMembership>>["supabase"];
}) {
  const { count, error } = await supabase.from("clinic_clients").select("id", { count: "exact", head: true }).eq("clinic_id", clinicId);
  return error ? <Notice tone="warning" role="status">No se pudo consultar el resumen en este momento.</Notice>
    : <p className="vet-muted text-sm">{count ?? 0} fichas registradas en esta clínica.</p>;
}

export default async function ClinicHomePage({ params }: { params: Promise<{ clinicId: string }> }) {
  const { clinicId } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(clinicId)) notFound();
  const { supabase, membership } = await requireClinicMembership(clinicId);
  return <main className="vet-shell vet-page space-y-7">
    <header className="flex flex-wrap items-start justify-between gap-2">
      <PageIntro title={membership.name} label={membership.role === "clinic_admin" ? "Administración de clínica" : "Personal de clínica"} />
      <form action={logoutAction}><button className="vet-button vet-button-secondary">Cerrar sesión</button></form>
    </header>
    <ClinicNav clinicId={clinicId} current="overview" profile={membership.role === "clinic_admin"} />
    <section className="vet-card vet-card-soft flex flex-wrap items-center justify-between gap-4">
      <div><span className="vet-badge">Panel operativo</span><h2 className="vet-card-title mt-2">Todo listo para gestionar el día</h2><p className="vet-muted mt-1 text-sm">Revisa primero las solicitudes pendientes y mantén actualizadas las fichas de tus pacientes.</p></div>
      <Link href={`/clinic/${clinicId}/appointments`} className="vet-button vet-button-primary">Ver citas pendientes</Link>
    </section>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Link href={`/clinic/${clinicId}/appointments`} className="vet-card vet-card-action flex gap-3">
        <span className="vet-icon-tile">◷</span><div><h2 className="vet-card-title">Solicitudes de cita</h2><p className="vet-muted mt-1 text-sm">Revisa solicitudes y confirma el horario acordado.</p></div>
      </Link>
      <Link href={`/clinic/${clinicId}/clients`} className="vet-card vet-card-action flex gap-3">
        <span className="vet-icon-tile">♟</span><div><h2 className="vet-card-title">Clientes y pacientes</h2>
        <Suspense fallback={<p role="status" className="vet-muted text-sm">Cargando resumen…</p>}>
          <ClientCount clinicId={clinicId} supabase={supabase} />
        </Suspense></div>
      </Link>
      {membership.role === "clinic_admin" && <Link href={`/clinic/${clinicId}/profile`} className="vet-card vet-card-action flex gap-3">
        <span className="vet-icon-tile">⌂</span><div><h2 className="vet-card-title">Perfil público</h2><p className="vet-muted mt-1 text-sm">Completa los datos, servicios y horarios de tu clínica.</p></div>
      </Link>}
    </div>
  </main>;
}
