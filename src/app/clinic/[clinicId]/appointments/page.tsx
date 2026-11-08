import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { requireClinicMembership } from "@/lib/auth/clinic";
import { appointment, limaDateTime } from "@/features/appointments/contract";
import { ConfirmationForm } from "@/features/appointments/confirmation-form";
import { ClinicNav, Notice, PageIntro } from "@/components/vetia-ui";

export const dynamic = "force-dynamic";

export default async function AppointmentInbox({ params, searchParams }: {
  params: Promise<{ clinicId: string }>;
  searchParams: Promise<{ estado?: string }>;
}) {
  const { clinicId } = await params;
  if (!z.uuid().safeParse(clinicId).success) notFound();
  const { supabase, membership } = await requireClinicMembership(clinicId);
  const status = (await searchParams).estado === "confirmed" ? "confirmed" : "pending";
  const path = `/clinic/${clinicId}/appointments`;
  const { data, error } = await supabase.from("appointments")
    .select("id,reference,contact_name,contact_phone,reason,preferred_at,status,agreed_at")
    .eq("clinic_id", clinicId).eq("status", status)
    .order("created_at", { ascending: false }).order("id", { ascending: false }).limit(50);
  const parsed = z.array(appointment).safeParse(data);
  return <main className="vet-shell vet-page space-y-4">
    <ClinicNav clinicId={clinicId} current="appointments" profile={membership.role === "clinic_admin"} />
    <PageIntro title="Solicitudes de cita"><p>Coordina directamente con el propietario antes de confirmar. Se muestran las 50 más recientes por estado.</p></PageIntro>
    <nav className="flex flex-wrap gap-2" aria-label="Estado de cita">
      <Link href={path} aria-current={status === "pending" ? "page" : undefined} className="vet-button vet-filter">Pendientes</Link>
      <Link href={`${path}?estado=confirmed`} aria-current={status === "confirmed" ? "page" : undefined} className="vet-button vet-filter">Confirmadas</Link>
    </nav>
    {error || !parsed.success ? <Notice tone="danger" role="alert">No se pudo cargar la bandeja. Recarga la página para intentar de nuevo.</Notice>
      : parsed.data.length === 0 ? <section className="vet-card"><h2 className="font-bold">No hay citas {status === "pending" ? "pendientes" : "confirmadas"}</h2>
        <p className="vet-muted mt-1">Las solicitudes aparecerán aquí cuando tengan este estado.</p></section>
      : <ul className="grid gap-4">
        {parsed.data.map((row) => <li key={row.id} className="vet-card">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-bold wrap-break-word">{row.contact_name}</h2>
            <span className={`vet-badge ${row.status === "pending" ? "vet-badge-pending" : ""}`}>{row.status === "pending" ? "Pendiente" : "Confirmada"}</span>
          </div>
          <p className="mt-1 text-sm">Teléfono: <a className="vet-link inline-flex min-h-11 items-center" href={`tel:${row.contact_phone}`}>{row.contact_phone}</a></p>
          <p className="mt-1 text-sm wrap-break-word">Motivo: {row.reason}</p>
          <p className="mt-1 text-sm">Horario preferido: {limaDateTime.format(new Date(row.preferred_at))}</p>
          <p className="mt-1 break-all text-sm text-slate-600">Referencia: {row.reference}</p>
          {row.agreed_at && <p className="vet-notice vet-notice-info mt-2 font-semibold">Horario acordado: {limaDateTime.format(new Date(row.agreed_at))}</p>}
          {row.status === "pending" && <ConfirmationForm clinicId={clinicId} appointmentId={row.id} />}
        </li>)}
      </ul>}
  </main>;
}
