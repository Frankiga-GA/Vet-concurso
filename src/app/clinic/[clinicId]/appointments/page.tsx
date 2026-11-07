import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { requireClinicMembership } from "@/lib/auth/clinic";
import { appointment, limaDateTime } from "@/features/appointments/contract";
import { ConfirmationForm } from "@/features/appointments/confirmation-form";

export const dynamic = "force-dynamic";

export default async function AppointmentInbox({ params, searchParams }: {
  params: Promise<{ clinicId: string }>;
  searchParams: Promise<{ estado?: string }>;
}) {
  const { clinicId } = await params;
  if (!z.uuid().safeParse(clinicId).success) notFound();
  const { supabase } = await requireClinicMembership(clinicId);
  const status = (await searchParams).estado === "confirmed" ? "confirmed" : "pending";
  const path = `/clinic/${clinicId}/appointments`;
  const { data, error } = await supabase.from("appointments")
    .select("id,reference,contact_name,contact_phone,reason,preferred_at,status,agreed_at")
    .eq("clinic_id", clinicId).eq("status", status)
    .order("created_at", { ascending: false }).order("id", { ascending: false }).limit(50);
  const parsed = z.array(appointment).safeParse(data);
  return <main className="mx-auto max-w-4xl px-5 py-8 sm:py-12">
    <Link href={`/clinic/${clinicId}`} className="text-sm font-semibold text-emerald-800">Volver a la clínica</Link>
    <h1 className="mt-5 text-3xl font-semibold">Solicitudes de cita</h1>
    <p className="mt-2 text-slate-600">Coordina directamente con el propietario antes de confirmar. La bandeja muestra las 50 más recientes por estado.</p>
    <nav className="mt-5 flex flex-wrap gap-3" aria-label="Estado de cita">
      <Link href={path} aria-current={status === "pending" ? "page" : undefined} className="rounded-full border border-emerald-800 px-4 py-2 text-emerald-800">Pendientes</Link>
      <Link href={`${path}?estado=confirmed`} aria-current={status === "confirmed" ? "page" : undefined} className="rounded-full border border-emerald-800 px-4 py-2 text-emerald-800">Confirmadas</Link>
    </nav>
    {error || !parsed.success ? <p role="alert" className="mt-6 text-rose-800">No se pudo cargar la bandeja.</p>
      : parsed.data.length === 0 ? <p className="mt-6 text-slate-600">No hay citas en este estado.</p>
      : <ul className="mt-6 grid gap-4">
        {parsed.data.map((row) => <li key={row.id} className="min-w-0 rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="font-semibold wrap-break-word">{row.contact_name}</h2>
          <p className="mt-1 text-sm">Teléfono: <a className="text-emerald-800 underline" href={`tel:${row.contact_phone}`}>{row.contact_phone}</a></p>
          <p className="mt-1 text-sm wrap-break-word">Motivo: {row.reason}</p>
          <p className="mt-1 text-sm">Preferencia: {limaDateTime.format(new Date(row.preferred_at))}</p>
          <p className="mt-1 break-all text-sm text-slate-600">Referencia: {row.reference}</p>
          {row.agreed_at && <p className="mt-2 font-semibold text-emerald-900">Confirmada: {limaDateTime.format(new Date(row.agreed_at))}</p>}
          {row.status === "pending" && <ConfirmationForm clinicId={clinicId} appointmentId={row.id} />}
        </li>)}
      </ul>}
  </main>;
}
