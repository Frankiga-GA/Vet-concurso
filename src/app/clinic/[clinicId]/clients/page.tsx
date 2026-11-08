import { randomUUID } from "node:crypto";
import { z } from "zod";
import { requireClinicRecords } from "@/features/clinic-records/access";
import { listedClient } from "@/features/clinic-records/contract";
import { ClinicClientSearch } from "@/features/clinic-records/client-search";
import { ClinicRecordForm } from "@/features/clinic-records/record-form";
import { createClinicClient, searchClinicClients } from "./actions";
import { ClinicNav, PageIntro } from "@/components/vetia-ui";

export const dynamic = "force-dynamic";

export default async function ClinicClientsPage({ params }: { params: Promise<{ clinicId: string }> }) {
  const { clinicId } = await params;
  const { supabase, membership } = await requireClinicRecords(clinicId);
  const { data, error } = await supabase.rpc("vetia_search_clinic_clients", { p_clinic_id: clinicId, p_query: "" });
  const parsed = z.array(listedClient).safeParse(data);
  const initial = !error && parsed.success ? { rows: parsed.data } : { rows: [], message: "No se pudo cargar el listado." };
  return <main className="vet-shell vet-page space-y-4">
    <ClinicNav clinicId={clinicId} current="clients" profile={membership.role === "clinic_admin"} />
    <PageIntro title="Clientes y pacientes"><p>Busca una ficha o registra un cliente para añadir sus pacientes.</p></PageIntro>
    <a href="#new-client" className="vet-button vet-button-secondary">Nuevo cliente</a>
    <section className="vet-card">
      <h2 className="text-xl font-semibold">Buscar clientes</h2>
      <ClinicClientSearch clinicId={clinicId} initial={initial} action={searchClinicClients.bind(null, clinicId)} />
    </section>
    <section className="vet-card" aria-labelledby="new-client">
      <h2 id="new-client" className="text-xl font-semibold">Nuevo cliente</h2>
      <ClinicRecordForm recordId={randomUUID()} kind="client" action={createClinicClient.bind(null, clinicId)} />
    </section>
  </main>;
}
