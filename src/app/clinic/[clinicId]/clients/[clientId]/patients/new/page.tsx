import { randomUUID } from "node:crypto";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { requireClinicRecords } from "@/features/clinic-records/access";
import { ClinicRecordForm } from "@/features/clinic-records/record-form";
import { createClinicPatient } from "../../../actions";
import { ClinicNav, PageIntro } from "@/components/vetia-ui";

export const dynamic = "force-dynamic";

export default async function NewClinicPatientPage({ params }: { params: Promise<{ clinicId: string; clientId: string }> }) {
  const { clinicId, clientId } = await params;
  if (!z.uuid().safeParse(clientId).success) notFound();
  const { supabase, membership } = await requireClinicRecords(clinicId);
  const { data, error } = await supabase.from("clinic_clients").select("full_name")
    .eq("clinic_id", clinicId).eq("id", clientId).maybeSingle();
  if (!error && !data) notFound();
  return <main className="vet-shell vet-page vet-narrow space-y-4">
    <ClinicNav clinicId={clinicId} current="clients" profile={membership.role === "clinic_admin"} />
    <Link href={`/clinic/${clinicId}/clients/${clientId}`} className="vet-link inline-flex min-h-11 items-center">← Ficha del cliente</Link>
    <section className="vet-card">
      <PageIntro title="Nuevo paciente" />
      {error || !data ? <p role="alert" className="mt-4">No se pudo comprobar la ficha del cliente.</p>
        : <>
          <p className="mt-2 wrap-break-word">Cliente · {data.full_name}</p>
          <ClinicRecordForm recordId={randomUUID()} kind="patient" action={createClinicPatient.bind(null, clinicId, clientId)} />
        </>}
    </section>
  </main>;
}
