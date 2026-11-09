import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { z } from "zod";
import { requireClinicMembership } from "@/lib/auth/clinic";
import { appointment, limaDateTime } from "@/features/appointments/contract";
import { ConfirmationForm } from "@/features/appointments/confirmation-form";
import { ClinicNav, Notice, PageIntro } from "@/components/vetia-ui";

export const dynamic = "force-dynamic";
const pageSize = 25;

export default async function AppointmentInbox({ params, searchParams }: {
  params: Promise<{ clinicId: string }>;
  searchParams: Promise<{ estado?: string; pagina?: string }>;
}) {
  const { clinicId } = await params;
  if (!z.uuid().safeParse(clinicId).success) notFound();
  const { supabase, membership } = await requireClinicMembership(clinicId);
  const filters = await searchParams;
  const status = filters.estado === "confirmed" ? "confirmed" : "pending";
  const page = typeof filters.pagina === "string" && /^[1-9]\d{0,5}$/.test(filters.pagina) ? Number(filters.pagina) : 1;
  const offset = (page - 1) * pageSize;
  const path = `/clinic/${clinicId}/appointments`;
  return <main className="vet-shell vet-page space-y-6">
    <ClinicNav clinicId={clinicId} current="appointments" profile={membership.role === "clinic_admin"} />
    <div className="grid items-end gap-4 md:grid-cols-[1fr_auto]"><PageIntro title="Solicitudes de cita" label="Agenda de atención"><p>Revisa cada solicitud y confirma únicamente cuando el horario haya sido coordinado con el propietario.</p></PageIntro><span className="vet-kicker">Confirmación manual</span></div>
    <nav className="flex flex-wrap gap-2" aria-label="Estado de cita">
      <Link href={path} aria-current={status === "pending" ? "page" : undefined} className="vet-button vet-filter">Pendientes</Link>
      <Link href={`${path}?estado=confirmed`} aria-current={status === "confirmed" ? "page" : undefined} className="vet-button vet-filter">Confirmadas</Link>
    </nav>
    <Suspense key={`${status}:${page}`} fallback={<Notice role="status">Cargando citas…</Notice>}>
      <AppointmentResults clinicId={clinicId} supabase={supabase} status={status} page={page} offset={offset} />
    </Suspense>
  </main>;
}

async function AppointmentResults({ clinicId, supabase, status, page, offset }: {
  clinicId: string;
  supabase: Awaited<ReturnType<typeof requireClinicMembership>>["supabase"];
  status: "pending" | "confirmed";
  page: number;
  offset: number;
}) {
  const pageUrl = (number: number) => `/clinic/${clinicId}/appointments?estado=${status}&pagina=${number}`;
  const { data, error } = await supabase.from("appointments")
    .select("id,reference,contact_name,contact_phone,reason,preferred_at,status,agreed_at")
    .eq("clinic_id", clinicId).eq("status", status)
    .order(status === "confirmed" ? "confirmed_at" : "created_at", { ascending: false })
    .order("id", { ascending: false }).range(offset, offset + pageSize);
  const parsed = z.array(appointment).safeParse(data);
  return <>
    {error || !parsed.success ? <Notice tone="danger" role="alert">No se pudo cargar la bandeja. Recarga la página para intentar de nuevo.</Notice>
      : parsed.data.length === 0 ? <section className="vet-empty">
        <span className="vet-empty-icon">◷</span><h2 className="font-bold">{page > 1 ? "Esta página está vacía" : `No hay citas ${status === "pending" ? "pendientes" : "confirmadas"}`}</h2>
        {page > 1 ? <Link href={pageUrl(1)} className="vet-link inline-flex min-h-11 items-center">Volver a la primera página</Link>
          : <p className="vet-muted mt-1">Las solicitudes aparecerán aquí cuando tengan este estado.</p>}
      </section>
      : <ul className="grid gap-3">
        {parsed.data.slice(0, pageSize).map((row) => <li key={row.id} className="vet-card vet-card-elevated">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="min-w-0 text-lg font-bold wrap-break-word">{row.contact_name}</h2>
            <span className={`vet-badge ${row.status === "pending" ? "vet-badge-pending" : ""}`}>{row.status === "pending" ? "Pendiente" : "Confirmada"}</span>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2"><div className="vet-stat"><p className="vet-muted text-xs">Contacto</p><a className="vet-link mt-1 inline-flex min-h-8 items-center" href={`tel:${row.contact_phone}`}>{row.contact_phone}</a></div><div className="vet-stat"><p className="vet-muted text-xs">Horario preferido</p><p className="mt-1 font-semibold">{limaDateTime.format(new Date(row.preferred_at))}</p></div></div>
          <p className="mt-4 text-sm wrap-break-word"><strong>Motivo:</strong> {row.reason}</p>
          <p className="mt-1 break-all text-sm text-slate-600">Referencia: {row.reference}</p>
          {row.agreed_at && <p className="vet-notice vet-notice-info mt-2 font-semibold">Horario acordado: {limaDateTime.format(new Date(row.agreed_at))}</p>}
          {row.status === "pending" && <ConfirmationForm clinicId={clinicId} appointmentId={row.id} />}
        </li>)}
      </ul>}
    {!error && parsed.success && (page > 1 || parsed.data.length > pageSize) && <nav aria-label="Páginas de citas" className="flex flex-wrap items-center gap-3">
      {page > 1 && <Link href={pageUrl(page - 1)} className="vet-button vet-button-secondary">Anterior</Link>}
      <span className="vet-muted text-sm">Página {page}</span>
      {parsed.data.length > pageSize && page < 999999 && <Link href={pageUrl(page + 1)} className="vet-button vet-button-secondary">Siguiente</Link>}
    </nav>}
  </>;
}
