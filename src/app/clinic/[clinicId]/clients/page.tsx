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
  return <main className="vet-shell vet-page space-y-7">
    <ClinicNav clinicId={clinicId} current="clients" profile={membership.role === "clinic_admin"} />
    <div className="flex flex-wrap items-end justify-between gap-4"><PageIntro title="Clientes y pacientes" label="Directorio interno"><p>Busca una ficha existente o registra un cliente para organizar sus pacientes.</p></PageIntro><a href="#new-client" className="vet-button vet-button-primary">+ Nuevo cliente</a></div>
    <section className="vet-card vet-card-elevated">
      <div className="flex items-center gap-3"><span className="vet-icon-tile">⌕</span><div><h2 className="vet-card-title">Buscar clientes</h2><p className="vet-muted text-sm">Busca por nombre, teléfono o correo registrado.</p></div></div>
      <ClinicClientSearch clinicId={clinicId} initial={initial} action={searchClinicClients.bind(null, clinicId)} />
    </section>
    <section className="vet-card" aria-labelledby="new-client">
      <span className="vet-kicker">Nueva ficha</span><h2 id="new-client" className="vet-section-title mt-3">Registrar cliente</h2><p className="vet-muted mt-2 text-sm">Los datos se guardan únicamente para esta clínica.</p>
      <ClinicRecordForm recordId={randomUUID()} kind="client" action={createClinicClient.bind(null, clinicId)} />
    </section>
  </main>;
}
