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
  const supabase = await requireClinicRecords(clinicId);
  const { data, error } = await supabase.from("clinic_clients").select("id,full_name,phone,email")
    .eq("clinic_id", clinicId).eq("id", clientId).maybeSingle();
  if (!error && !data) notFound();
  const client = clientDetail.safeParse(data);
  const listUrl = `/clinic/${clinicId}/clients`;
  if (error || !client.success) return <main className="vet-shell vet-page space-y-4">
    <ClinicNav clinicId={clinicId} current="clients" />
    <Notice tone="danger" role="alert">No se pudo cargar la ficha.</Notice>
  </main>;

  const patients = await supabase.from("clinic_patients").select("id,name,species,breed,sex,birth_date")
    .eq("clinic_id", clinicId).eq("clinic_client_id", clientId).order("name").order("id").limit(101);
  const parsed = z.array(listedPatient).safeParse(patients.data);
  return <main className="vet-shell vet-page space-y-4">
    <ClinicNav clinicId={clinicId} current="clients" />
    <Link href={listUrl} className="vet-link inline-flex min-h-11 items-center">← Clientes</Link>
    <section className="vet-card">
      <PageIntro title={client.data.full_name} label="Ficha del cliente" />
      <dl className="mt-4 grid gap-3 wrap-break-word">
        <div><dt className="font-semibold">Teléfono</dt><dd>{client.data.phone}</dd></div>
        <div><dt className="font-semibold">Correo</dt><dd>{client.data.email ?? "Sin registrar"}</dd></div>
      </dl>
    </section>
    <section id="pacientes" className="vet-card">
      <h2 className="text-xl font-semibold">Pacientes</h2>
      <Link href={`${listUrl}/${clientId}/patients/new`} className="vet-button vet-button-primary mt-3">Añadir paciente</Link>
      {patients.error || !parsed.success ? <p role="alert" className="vet-notice vet-notice-danger mt-4">No se pudieron cargar los pacientes.</p>
        : parsed.data.length === 0 ? <p className="vet-notice vet-notice-info mt-4">Este cliente todavía no tiene pacientes.</p>
        : <ul className="mt-4 divide-y divide-slate-200">
          {parsed.data.slice(0, 100).map((patient) => <li key={patient.id} className="py-3 wrap-break-word">
            <h3 className="font-semibold">{patient.name}</h3>
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
