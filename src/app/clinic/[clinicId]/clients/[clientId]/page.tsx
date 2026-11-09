import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { requireClinicRecords } from "@/features/clinic-records/access";
import { clientDetail, listedPatient } from "@/features/clinic-records/contract";
import { ClinicNav, Notice, PageIntro } from "@/components/vetia-ui";

export const dynamic = "force-dynamic";

export default async function ClinicClientPage({ params }: { params: Promise<{ clinicId: string; clientId: string }> }) {
  const { clinicId, clientId } = await params;
  if (!z.uuid().safeParse(clientId).success) notFound();
  const { supabase, membership } = await requireClinicRecords(clinicId);
  const { data, error } = await supabase.from("clinic_clients").select("id,full_name,phone,email")
    .eq("clinic_id", clinicId).eq("id", clientId).maybeSingle();
  if (!error && !data) notFound();
  const client = clientDetail.safeParse(data);
  const listUrl = `/clinic/${clinicId}/clients`;
  if (error || !client.success) return <main className="vet-shell vet-page space-y-4">
    <ClinicNav clinicId={clinicId} current="clients" profile={membership.role === "clinic_admin"} />
    <Link href={listUrl} className="vet-link inline-flex min-h-11 items-center">← Clientes</Link>
    <Notice tone="danger" role="alert">No se pudo cargar la ficha.</Notice>
  </main>;

  const patients = await supabase.from("clinic_patients").select("id,name,species,breed,sex,birth_date")
    .eq("clinic_id", clinicId).eq("clinic_client_id", clientId).order("name").order("id").limit(101);
  const parsed = z.array(listedPatient).safeParse(patients.data);
  return <main className="vet-shell vet-page space-y-6">
    <ClinicNav clinicId={clinicId} current="clients" profile={membership.role === "clinic_admin"} />
    <Link href={listUrl} className="vet-link inline-flex min-h-11 items-center">← Clientes</Link>
    <section className="vet-card vet-card-elevated">
      <div className="flex flex-wrap items-start gap-4"><span className="vet-icon-tile">♟</span><PageIntro title={client.data.full_name} label="Ficha del cliente" /></div>
      <dl className="mt-5 grid gap-3 wrap-break-word sm:grid-cols-2">
        <div className="vet-stat"><dt className="vet-muted text-sm">Teléfono</dt><dd className="mt-1 font-semibold">{client.data.phone}</dd></div>
        <div className="vet-stat"><dt className="vet-muted text-sm">Correo</dt><dd className="mt-1 font-semibold">{client.data.email ?? "Sin registrar"}</dd></div>
      </dl>
    </section>
    <section id="pacientes" className="vet-card">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="vet-eyebrow">Mascotas vinculadas</p><h2 className="vet-section-title mt-1">Pacientes</h2></div><Link href={`${listUrl}/${clientId}/patients/new`} className="vet-button vet-button-primary">+ Añadir paciente</Link></div>
      {patients.error || !parsed.success ? <p role="alert" className="vet-notice vet-notice-danger mt-4">No se pudieron cargar los pacientes.</p>
        : parsed.data.length === 0 ? <div className="vet-empty mt-4"><span className="vet-empty-icon">🐾</span><h3 className="vet-card-title">Aún no hay pacientes</h3><p className="vet-muted text-sm">Registra la primera mascota asociada a este cliente.</p></div>
        : <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {parsed.data.slice(0, 100).map((patient) => <li key={patient.id} className="rounded-xl border border-[var(--line)] bg-[var(--paper)] p-4 wrap-break-word">
            <div className="flex items-center gap-3"><span className="vet-icon-tile">🐾</span><h3 className="font-semibold">{patient.name}</h3></div>
            <p>{patient.species}{patient.breed && ` · ${patient.breed}`}</p>
            <p className="text-sm text-slate-700">
              {patient.sex === "male" ? "Macho" : patient.sex === "female" ? "Hembra" : "Sexo sin especificar"}
              {patient.birth_date && ` · Nacimiento: ${patient.birth_date}`}
            </p>
          </li>)}
        </ul>}
      {parsed.success && parsed.data.length > 100 && <p className="mt-2 text-sm">Se muestran los primeros 100 pacientes.</p>}
    </section>
  </main>;
}
