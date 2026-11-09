import Link from "next/link";
import { z } from "zod";
import { requirePlatformAdminAal2 } from "@/lib/auth/session";
import { applicationReadError } from "@/features/clinic-applications/admin-read";
import { AdministrativeDecisionPreview } from "@/features/clinic-applications/administrative-decision-preview";
import { AccreditationPanel } from "@/features/clinic-applications/accreditation-panel";
import { applicationDocumentSchema, accreditationSchema } from "@/features/clinic-applications/accreditation-contract";
import { adminDecisionsEnabled } from "@/features/clinic-applications/decision-feature";
import { submitAdministrativeDecision } from "./actions";
import { submitClinicPublication } from "./publication-actions";
import { activateClinic } from "./activation-actions";
import { ClinicActivationPanel } from "@/features/clinic-applications/activation-panel";
import { clinicPublicationEnabled } from "@/features/clinic-profile/publication-feature";
import { publicationReview } from "@/features/clinic-profile/publication-contract";
import { ClinicPublicationPanel } from "@/features/clinic-profile/publication-panel";
import { AdminNav, Notice, PageIntro } from "@/components/vetia-ui";
import {
  adminApplicationsPath, applicationDateFormatter, applicationDetail, statusLabels, summaryColumns,
} from "@/features/clinic-applications/admin-query";

export const dynamic = "force-dynamic";

const applicationPrivateDetails = z.object({
  legal_name: z.string().nullable(), ruc: z.string().nullable(), address: z.string().nullable(),
  legal_representative_name: z.string().nullable(), representative_document: z.string().nullable(),
  veterinarian_name: z.string().nullable(), veterinarian_license: z.string().nullable(),
  services: z.array(z.string()).nullable(), opening_hours: z.unknown().nullable(),
});

export default async function AdminClinicApplicationPage({ params }: { params: Promise<{ id: string }> }) {
  const { supabase, user } = await requirePlatformAdminAal2();
  const enabled = adminDecisionsEnabled();
  const id = z.uuid().safeParse((await params).id);
  let application: z.infer<typeof applicationDetail> | undefined;
  let message = "No encontramos esa solicitud.";

  if (id.success) {
    const { data, error, status } = await supabase.from("clinic_applications")
      .select(`${summaryColumns},decision_message,reviewed_at`)
      .eq("id", id.data)
      .maybeSingle();
    if (error) message = applicationReadError(status);
    else if (data) {
      const parsed = applicationDetail.safeParse(data);
      if (parsed.success) application = parsed.data;
      else message = applicationReadError(status);
    }
  }

  const rawDocs = application ? await supabase.rpc("vetia_get_application_documents", { p_application_id: application.id }) : null;
  const parsedDocs = z.array(applicationDocumentSchema).safeParse(rawDocs?.data);
  const docsWithUrls: Array<z.infer<typeof applicationDocumentSchema> & { downloadUrl: string }> = [];
  if (parsedDocs.success) {
    for (const doc of parsedDocs.data) {
      const { data: signed } = await supabase.storage.from("clinic-accreditation").createSignedUrl(doc.storage_path, 900);
      docsWithUrls.push({ ...doc, downloadUrl: signed?.signedUrl ?? "#" });
    }
  }

  const rawAcc = application ? await supabase.rpc("vetia_get_clinic_accreditation", { p_application_id: application.id }).maybeSingle() : null;
  const accreditation = accreditationSchema.nullable().safeParse(rawAcc?.data);

  const publicationEnabled = clinicPublicationEnabled();
  const detailsResult = application ? await supabase.rpc("vetia_get_admin_clinic_application_details", { p_application_id: application.id }).maybeSingle() : null;
  const privateDetails = applicationPrivateDetails.nullable().safeParse(detailsResult?.data);
  const publication = application?.submission_status === "approved" && (publicationEnabled || enabled)
    ? await supabase.rpc("vetia_get_clinic_publication", { p_application_id: application.id }) : null;
  const profile = publicationReview.safeParse(publication?.data);

  const missingDataFields: string[] = [];
  if (!privateDetails.data?.ruc || privateDetails.data.ruc.length !== 11) missingDataFields.push("RUC de 11 dígitos");
  if (!privateDetails.data?.legal_name) missingDataFields.push("Razón social");
  if (!privateDetails.data?.legal_representative_name) missingDataFields.push("Responsable legal");
  if (!privateDetails.data?.veterinarian_name) missingDataFields.push("Veterinario responsable");
  if (!privateDetails.data?.veterinarian_license) missingDataFields.push("Colegiatura (CMVP)");
  const isDataIncomplete = Boolean(application && missingDataFields.length > 0);

  return <main className="vet-shell vet-page space-y-4">
    <AdminNav current="applications" />
    <Link href={adminApplicationsPath} className="vet-link inline-flex min-h-11 items-center">← Volver a solicitudes</Link>
    <section className="vet-card space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="vet-eyebrow">Paso 1</p>
          <PageIntro title={application?.business_name ?? "Solicitud de veterinaria"} label="Datos del establecimiento y legales" />
        </div>
        {application && (
          <div className="flex flex-wrap items-center gap-2">
            {isDataIncomplete && (
              <span className="vet-badge vet-badge-danger">Información incompleta</span>
            )}
            <span className="vet-badge">{statusLabels[application.submission_status]}</span>
          </div>
        )}
      </div>

      {application ? (
        <div className="space-y-4">
          {isDataIncomplete && (
            <div className="rounded-xl border border-amber-300 bg-amber-50/90 p-3 text-xs text-amber-950">
              <span className="font-semibold">⚠️ Solicitud con datos incompletos:</span> faltan registrar{" "}
              <strong>{missingDataFields.join(" · ")}</strong>. En el Paso 3 puedes solicitar al postulante que complete estos datos desde su cuenta.
            </div>
          )}

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Datos de contacto del establecimiento</h3>
            <dl className="mt-2 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
              <div className="vet-stat"><dt className="vet-muted text-xs font-semibold uppercase tracking-wide">Ciudad</dt><dd className="mt-1 font-bold">{application.city}</dd></div>
              <div className="vet-stat"><dt className="vet-muted text-xs font-semibold uppercase tracking-wide">Contacto</dt><dd className="mt-1 wrap-break-word font-bold">{application.contact_name}</dd></div>
              <div className="vet-stat"><dt className="vet-muted text-xs font-semibold uppercase tracking-wide">Correo</dt><dd className="mt-1 wrap-break-word">{application.contact_email}</dd></div>
              <div className="vet-stat"><dt className="vet-muted text-xs font-semibold uppercase tracking-wide">Teléfono</dt><dd className="mt-1">{application.contact_phone}</dd></div>
              <div className="vet-stat"><dt className="vet-muted text-xs font-semibold uppercase tracking-wide">Fecha de envío</dt><dd className="mt-1"><time dateTime={application.submitted_at}>
                {applicationDateFormatter.format(new Date(application.submitted_at))}
              </time></dd></div>
              {application.decision_message && <div className="vet-notice vet-notice-info sm:col-span-2 lg:col-span-3">
                <dt className="font-semibold">Mensaje de revisión</dt>
                <dd className="mt-1 wrap-break-word whitespace-pre-wrap">{application.decision_message}</dd>
              </div>}
            </dl>
          </div>

          {detailsResult?.error || !privateDetails.success ? (
            <Notice tone="danger" role="alert">No pudimos cargar el expediente ampliado. Recarga la página antes de decidir.</Notice>
          ) : privateDetails.data ? (
            <div className="pt-3 border-t border-[var(--line)]">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Expediente privado (MFA AAL2)</h3>
                <span className="text-[11px] text-slate-500">No publicado en directorio público</span>
              </div>
              <dl className="mt-2 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
                <div className="vet-stat"><dt className="vet-muted text-xs font-semibold uppercase tracking-wide">Razón social</dt><dd className="mt-1 wrap-break-word font-bold">{privateDetails.data.legal_name ?? <span className="text-rose-600 font-semibold">No registrada</span>}</dd></div>
                <div className="vet-stat"><dt className="vet-muted text-xs font-semibold uppercase tracking-wide">RUC</dt><dd className="mt-1 font-bold">{privateDetails.data.ruc ?? <span className="text-rose-600 font-semibold">No registrado</span>}</dd></div>
                <div className="vet-stat"><dt className="vet-muted text-xs font-semibold uppercase tracking-wide">Dirección</dt><dd className="mt-1 wrap-break-word">{privateDetails.data.address ?? <span className="text-slate-400">No registrada</span>}</dd></div>
                <div className="vet-stat"><dt className="vet-muted text-xs font-semibold uppercase tracking-wide">Responsable legal</dt><dd className="mt-1 wrap-break-word font-bold">{privateDetails.data.legal_representative_name ?? <span className="text-rose-600 font-semibold">No registrado</span>}</dd></div>
                <div className="vet-stat"><dt className="vet-muted text-xs font-semibold uppercase tracking-wide">Documento privado</dt><dd className="mt-1 font-bold">{privateDetails.data.representative_document ?? <span className="text-slate-400">No registrado</span>}</dd></div>
                <div className="vet-stat"><dt className="vet-muted text-xs font-semibold uppercase tracking-wide">Veterinario responsable</dt><dd className="mt-1 wrap-break-word font-bold">{privateDetails.data.veterinarian_name ?? <span className="text-rose-600 font-semibold">No registrado</span>}</dd></div>
                <div className="vet-stat"><dt className="vet-muted text-xs font-semibold uppercase tracking-wide">Colegiatura</dt><dd className="mt-1 font-bold">{privateDetails.data.veterinarian_license ?? <span className="text-rose-600 font-semibold">No registrada</span>}</dd></div>
                <div className="vet-stat sm:col-span-2"><dt className="vet-muted text-xs font-semibold uppercase tracking-wide">Servicios</dt><dd className="mt-1 wrap-break-word">{privateDetails.data.services?.join(" · ") || "No registrados"}</dd></div>
                <div className="vet-stat sm:col-span-2 lg:col-span-3"><dt className="vet-muted text-xs font-semibold uppercase tracking-wide">Horarios declarados</dt><dd className="mt-1 wrap-break-word whitespace-pre-wrap">{privateDetails.data.opening_hours ? JSON.stringify(privateDetails.data.opening_hours) : "No registrados"}</dd></div>
              </dl>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="mt-4"><Notice tone="danger" role="alert">{message}</Notice></div>
      )}
    </section>
    {application && <AccreditationPanel
      applicationId={application.id}
      ruc={privateDetails.data?.ruc ?? null}
      legalName={privateDetails.data?.legal_name ?? null}
      representativeName={privateDetails.data?.legal_representative_name ?? null}
      veterinarianName={privateDetails.data?.veterinarian_name ?? null}
      veterinarianLicense={privateDetails.data?.veterinarian_license ?? null}
      documents={docsWithUrls}
      accreditation={accreditation.success ? accreditation.data : null}
    />}
    {application && <AdministrativeDecisionPreview
      status={application.submission_status}
      review={enabled ? {
        userId: user.id, applicationId: application.id, expectedReviewedAt: application.reviewed_at,
      } : undefined}
      submitDecisionAction={enabled ? submitAdministrativeDecision : undefined}
      isAccredited={accreditation.success ? (accreditation.data?.is_representation_active ?? false) : false}
    />}
    {application?.submission_status === "approved" && <section className="vet-card space-y-2">
      <h2 className="text-xl font-semibold">Activación de clínica</h2>
      {!enabled ? <Notice tone="warning">La activación administrativa está deshabilitada.</Notice>
        : profile.success && profile.data.lifecycle === "pending_activation" && application.reviewed_at
          ? <ClinicActivationPanel key={application.reviewed_at} clinicId={profile.data.clinicId} userId={user.id}
              reviewedAt={application.reviewed_at} action={activateClinic} />
          : profile.success ? <p className="vet-muted text-sm">Estado operativo · {{
              active: "Activa", inactive: "Inactiva", suspended: "Suspendida", pending_activation: "Revisión no disponible",
            }[profile.data.lifecycle]}</p>
          : <Notice tone="warning">No se pudo comprobar una clínica vinculada a la solicitud.</Notice>}
    </section>}
    {application?.submission_status === "approved" && <section className="vet-card">
      <h2 className="text-xl font-semibold">Publicación de clínica</h2>
      {!publicationEnabled ? <div className="mt-3"><Notice tone="warning">La publicación administrativa está deshabilitada.</Notice></div>
        : profile.success ? <ClinicPublicationPanel profile={profile.data} userId={user.id} action={submitClinicPublication} />
        : <p role="status" className="mt-2 text-sm">{publication?.error || publication?.data
          ? "No se pudo cargar el estado de publicación."
          : "No hay una clínica disponible para esta solicitud."}</p>}
    </section>}
  </main>;
}
