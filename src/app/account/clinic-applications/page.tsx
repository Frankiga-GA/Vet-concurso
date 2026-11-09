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
  submitted: "Enviada (en revisión documental)",
  needs_information: "Requiere información o documentos adicionales",
  approved: "Aprobada por superadmin",
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

  return (
    <>
      <PublicHeader current="account" />
      <main className="vet-shell vet-page space-y-6">
        <OwnerNav current="applications" modality={user.user_metadata?.account_type === "agro" ? "agro" : "mascotas"} />

        <div className="flex flex-wrap items-start justify-between gap-4">
          <PageIntro
            title="Solicitar incorporación de mi clínica"
            label="Espacio para profesionales"
          >
            <p>
              Inicia el proceso formal de acreditación declarando tu personería jurídica y aportando los documentos de sustento.
            </p>
          </PageIntro>
          <form action={logoutAction}>
            <button className="vet-button vet-button-secondary">Cerrar sesión</button>
          </form>
        </div>

        {/* Banner de protección y alcance del proceso */}
        <section className="rounded-2xl border border-amber-300 bg-amber-50/80 p-4 sm:p-5 text-amber-950 shadow-xs">
          <div className="flex items-start gap-3">
            <span className="text-2xl select-none">🛡️</span>
            <div className="space-y-1.5 text-xs sm:text-sm">
              <h2 className="font-bold text-amber-950">
                Reglas del proceso de incorporación en VetIA
              </h2>
              <p className="text-amber-900 leading-relaxed">
                Una cuenta de usuario normal <strong>no puede crear ni administrar veterinarias directamente</strong>. Solo puedes solicitar la incorporación declarando ser propietario o representante autorizado y aportando los documentos requeridos.
              </p>
              <ul className="list-disc list-inside space-y-1 pt-1 text-amber-800">
                <li>
                  <strong>Sin acceso operativo inmediato:</strong> La solicitud no habilita el panel de clínica ni otorga permisos hasta su aprobación y posterior activación.
                </li>
                <li>
                  <strong>Sin publicación inmediata:</strong> La clínica no aparece en el directorio público hasta completar la revisión documental y la fase de publicación separada.
                </li>
                <li>
                  <strong>Verificación por superadmin:</strong> Es obligatorio adjuntar Ficha RUC en SUNAT, DNI del titular, vigencia de poder y constancia de colegiatura CMVP.
                </li>
                <li>
                  <strong>Unicidad por RUC:</strong> Se impiden solicitudes duplicadas para un mismo RUC.
                </li>
              </ul>
            </div>
          </div>
        </section>

        <div className="flex flex-wrap gap-3">
          <a href="#new-application" className="vet-button vet-button-primary">
            Solicitar incorporación de mi clínica
          </a>
        </div>

        <section aria-labelledby="my-applications" className="vet-card space-y-3">
          <h2 id="my-applications" className="text-xl font-semibold text-[var(--ink)]">
            Mis solicitudes de incorporación
          </h2>
          {error || !applications.success ? (
            <Notice tone="danger" role="alert">
              No pudimos cargar tus solicitudes. Recarga la página para volver a intentarlo.
            </Notice>
          ) : applications.data.length === 0 ? (
            <EmptyState icon="📋" title="Aún no tienes solicitudes enviadas">
              <p>
                Completa el formulario inferior declarando tu condición de titular o representante y adjunta los documentos de sustento para iniciar la revisión.
              </p>
            </EmptyState>
          ) : (
            <ul className="mt-4 space-y-4">
              {applications.data.map((application) => (
                <li
                  key={application.id}
                  className="rounded-2xl border border-[var(--line)] bg-white p-5 shadow-[var(--shadow-sm)] space-y-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h3 className="min-w-0 font-bold text-lg text-slate-900 wrap-break-word">
                        {application.business_name}
                      </h3>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {application.city} · Enviada el{" "}
                        <time dateTime={application.submitted_at}>
                          {dateFormatter.format(new Date(application.submitted_at))}
                        </time>
                      </p>
                    </div>
                    <span
                      className={`vet-badge ${
                        application.submission_status === "rejected"
                          ? "vet-badge-danger"
                          : application.submission_status === "approved"
                          ? ""
                          : "vet-badge-pending"
                      }`}
                    >
                      {statusLabels[application.submission_status]}
                    </span>
                  </div>

                  {application.decision_message && (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
                      <span className="font-semibold text-slate-900">Mensaje de revisión del superadministrador: </span>
                      <span className="wrap-break-word">{application.decision_message}</span>
                    </div>
                  )}

                  {application.submission_status === "approved" && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900">
                      <p className="font-bold">✓ Solicitud aprobada por el superadministrador</p>
                      <p className="mt-0.5 text-emerald-800">
                        La activación de permisos operativos y la publicación en el directorio se procesan en fases independientes para garantizar la seguridad.
                      </p>
                    </div>
                  )}

                  {application.submission_status !== "approved" &&
                    application.submission_status !== "rejected" && (
                      <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-3 text-xs text-blue-900 space-y-1">
                        <p className="font-bold text-blue-950">Aporte obligatorio de documentos:</p>
                        <p className="text-blue-800">
                          Para avanzar con la revisión, adjunta los 4 sustentos clave: Ficha RUC (SUNAT), DNI del representante, Vigencia de poder (SUNARP) y Constancia de habilidad CMVP.
                        </p>
                        <CompleteDetailsForm
                          applicationId={application.id}
                          initialData={detailsByApp[application.id]}
                        />
                      </div>
                    )}

                  <DocumentUploader
                    applicationId={application.id}
                    documents={docsByApp[application.id] || []}
                    isClosed={
                      application.submission_status === "approved" ||
                      application.submission_status === "rejected"
                    }
                  />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="new-application" className="vet-card scroll-mt-28">
          <p className="vet-eyebrow">Formulario formal de incorporación</p>
          <h2 id="new-application" className="vet-card-title mt-1">
            Solicitar incorporación de mi clínica
          </h2>
          <p className="vet-muted mt-2 text-sm">
            Completa la información formal del establecimiento y declara tu personería. Deberás adjuntar documentos de sustento. Esta solicitud no otorga acceso inmediato al panel ni publica la clínica en el directorio.
          </p>
          <ApplicationForm key={user.id} userId={user.id} />
        </section>
      </main>
    </>
  );
}
