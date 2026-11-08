import Link from "next/link";
import { z } from "zod";
import { requirePlatformAdminAal2 } from "@/lib/auth/session";
import { applicationReadError } from "@/features/clinic-applications/admin-read";
import { AdministrativeDecisionPreview } from "@/features/clinic-applications/administrative-decision-preview";
import { adminDecisionsEnabled } from "@/features/clinic-applications/decision-feature";
import { submitAdministrativeDecision } from "./actions";
import { submitClinicPublication } from "./publication-actions";
import { clinicPublicationEnabled } from "@/features/clinic-profile/publication-feature";
import { publicationReview } from "@/features/clinic-profile/publication-contract";
import { ClinicPublicationPanel } from "@/features/clinic-profile/publication-panel";
import { AdminNav, Notice, PageIntro } from "@/components/vetia-ui";
import {
  adminApplicationsPath, applicationDateFormatter, applicationDetail, statusLabels, summaryColumns,
} from "@/features/clinic-applications/admin-query";

export const dynamic = "force-dynamic";

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

  const publicationEnabled = clinicPublicationEnabled();
  const publication = application?.submission_status === "approved" && publicationEnabled
    ? await supabase.rpc("vetia_get_clinic_publication", { p_application_id: application.id }) : null;
  const profile = publicationReview.safeParse(publication?.data);

  return <main className="vet-shell vet-page space-y-4">
    <AdminNav current="applications" />
    <Link href={adminApplicationsPath} className="vet-link inline-flex min-h-11 items-center">← Volver a solicitudes</Link>
    <section className="vet-card">
      <PageIntro title={application?.business_name ?? "Solicitud de veterinaria"} label="Detalle de solicitud" />
      {application ? <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
        <div><dt className="font-semibold">Estado</dt><dd>{statusLabels[application.submission_status]}</dd></div>
        <div><dt className="font-semibold">Ciudad</dt><dd>{application.city}</dd></div>
        <div><dt className="font-semibold">Contacto</dt><dd className="wrap-break-word">{application.contact_name}</dd></div>
        <div><dt className="font-semibold">Correo</dt><dd className="wrap-break-word">{application.contact_email}</dd></div>
        <div><dt className="font-semibold">Teléfono</dt><dd>{application.contact_phone}</dd></div>
        <div><dt className="font-semibold">Enviada el</dt><dd><time dateTime={application.submitted_at}>
          {applicationDateFormatter.format(new Date(application.submitted_at))}
        </time></dd></div>
        {application.decision_message && <div className="sm:col-span-2">
          <dt className="font-semibold">Mensaje de revisión</dt>
          <dd className="mt-1 wrap-break-word whitespace-pre-wrap">{application.decision_message}</dd>
        </div>}
      </dl> : <div className="mt-4"><Notice tone="danger" role="alert">{message}</Notice></div>}
    </section>
    {application && <AdministrativeDecisionPreview
      status={application.submission_status}
      review={enabled ? {
        userId: user.id, applicationId: application.id, expectedReviewedAt: application.reviewed_at,
      } : undefined}
      submitDecisionAction={enabled ? submitAdministrativeDecision : undefined}
    />}
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
