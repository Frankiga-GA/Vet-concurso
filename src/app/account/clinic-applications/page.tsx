import { z } from "zod";
import { logoutAction } from "@/app/auth/actions";
import { ApplicationForm } from "@/features/clinic-applications/application-form";
import { DocumentUploader } from "@/features/clinic-applications/document-uploader";
import { CompleteDetailsForm } from "@/features/clinic-applications/complete-details-form";
import { applicationDocumentSchema, type ApplicationDocument } from "@/features/clinic-applications/accreditation-contract";
import { requireUser } from "@/lib/auth/session";
import { EmptyState, Notice, OwnerNav, PageIntro, PublicHeader } from "@/components/vetia-ui";

export const dynamic = "force-dynamic";

const statusLabels = {
  submitted: "Enviada",
  needs_information: "Requiere información",
  approved: "Aprobada",
  rejected: "Rechazada",
};

const applicationList = z.array(z.object({
  id: z.uuid(),
  business_name: z.string(),
  city: z.string(),
  submission_status: z.enum(["submitted", "needs_information", "approved", "rejected"]),
  submitted_at: z.iso.datetime({ offset: true }),
  decision_message: z.string().nullable(),
}));

const dateFormatter = new Intl.DateTimeFormat("es-PE", { dateStyle: "medium", timeZone: "America/Lima" });

export default async function ClinicApplicationsPage() {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase.from("clinic_applications")
    .select("id,business_name,city,submission_status,submitted_at,decision_message")
    .eq("applicant_user_id", user.id)
    .order("submitted_at", { ascending: false });
  const applications = applicationList.safeParse(data);

  const docsByApp: Record<string, ApplicationDocument[]> = {};
  const detailsByApp: Record<string, {
    legalName?: string | null;
    ruc?: string | null;
    address?: string | null;
    legalRepresentativeName?: string | null;
    veterinarianName?: string | null;
    veterinarianLicense?: string | null;
  }> = {};

  if (applications.success) {
    for (const app of applications.data) {
      const { data: docs } = await supabase.rpc("vetia_get_application_documents", { p_application_id: app.id });
      const parsedDocs = z.array(applicationDocumentSchema).safeParse(docs);
      if (parsedDocs.success) {
        docsByApp[app.id] = parsedDocs.data;
      }
      const { data: details } = await supabase.rpc("vetia_get_my_clinic_application_details", { p_application_id: app.id }).maybeSingle();
      if (details) {
        const d = details as Record<string, string | null>;
        detailsByApp[app.id] = {
          legalName: d.legal_name,
          ruc: d.ruc,
          address: d.address,
          legalRepresentativeName: d.legal_representative_name,
          veterinarianName: d.veterinarian_name,
          veterinarianLicense: d.veterinarian_license,
        };
      }
    }
  }

  return <><PublicHeader current="account" /><main className="vet-shell vet-page space-y-6">
    <OwnerNav current="applications" />
    <div className="flex flex-wrap items-start justify-between gap-4">
      <PageIntro title="Incorporación de veterinarias" label="Mi cuenta"><p>Envía una solicitud para sumar tu establecimiento a VetIA y consulta su avance.</p></PageIntro>
      <form action={logoutAction}><button className="vet-button vet-button-secondary">Cerrar sesión</button></form>
    </div>
    <a href="#new-application" className="vet-button vet-button-primary">Registrar una veterinaria</a>
    <section aria-labelledby="my-applications" className="vet-card space-y-3">
      <h2 id="my-applications" className="text-xl font-semibold">Mis solicitudes</h2>
      {error || !applications.success
        ? <Notice tone="danger" role="alert">No pudimos cargar tus solicitudes. Recarga la página para volver a intentarlo.</Notice>
        : applications.data.length === 0
          ? <EmptyState icon="+" title="Aún no tienes solicitudes"><p>Cuando envíes una solicitud, podrás consultar aquí su estado y los mensajes de revisión.</p></EmptyState>
          : <ul className="mt-4 space-y-3">
            {applications.data.map((application) => <li key={application.id} className="rounded-2xl border border-[var(--line)] bg-white p-4 shadow-[var(--shadow-sm)]">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h3 className="min-w-0 font-semibold wrap-break-word">{application.business_name}</h3>
                <span className={`vet-badge ${application.submission_status === "rejected" ? "vet-badge-danger" : application.submission_status === "approved" ? "" : "vet-badge-pending"}`}>
                  {statusLabels[application.submission_status]}
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-600">
                {application.city} · <time dateTime={application.submitted_at}>{dateFormatter.format(new Date(application.submitted_at))}</time>
              </p>
              {application.decision_message && <p className="mt-2 text-sm wrap-break-word text-slate-700">{application.decision_message}</p>}
              {application.submission_status === "approved" && <p className="vet-muted mt-2 text-sm">La activación y la publicación de la clínica se gestionan por separado.</p>}
              {application.submission_status !== "approved" && application.submission_status !== "rejected" && (
                <CompleteDetailsForm
                  applicationId={application.id}
                  initialData={detailsByApp[application.id]}
                />
              )}
              <DocumentUploader
                applicationId={application.id}
                documents={docsByApp[application.id] || []}
                isClosed={application.submission_status === "approved" || application.submission_status === "rejected"}
              />
            </li>)}
          </ul>}
    </section>
    <section aria-labelledby="new-application" className="vet-card scroll-mt-28">
      <p className="vet-eyebrow">Nuevo establecimiento</p>
      <h2 id="new-application" className="vet-card-title mt-1">Datos para solicitar incorporación</h2>
      <p className="vet-muted mt-2 text-sm">Revisaremos la información antes de habilitar cualquier acceso operativo o publicación.</p>
      <ApplicationForm key={user.id} userId={user.id} />
    </section>
  </main></>;
}
