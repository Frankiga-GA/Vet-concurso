import Link from "next/link";
import { z } from "zod";
import { requirePlatformAdminAal2 } from "@/lib/auth/session";
import { applicationReadError } from "@/features/clinic-applications/admin-read";
import { AdministrativeDecisionPreview } from "@/features/clinic-applications/administrative-decision-preview";
import { adminDecisionsEnabled } from "@/features/clinic-applications/decision-feature";
import { submitAdministrativeDecision } from "./actions";
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

  return <main className="mx-auto max-w-4xl px-5 py-8 sm:py-12">
    <Link href={adminApplicationsPath} className="text-sm font-semibold text-emerald-800 hover:underline">Volver a solicitudes</Link>
    <section className="mt-6 rounded-3xl bg-white p-5 shadow-sm sm:p-8">
      <p className="text-sm font-semibold text-emerald-800">Detalle de solicitud</p>
      <h1 className="mt-2 text-3xl font-semibold wrap-break-word">{application?.business_name ?? "Solicitud de veterinaria"}</h1>
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
      </dl> : <p role="alert" className="mt-4 text-sm text-slate-700">{message}</p>}
    </section>
    {application && <AdministrativeDecisionPreview
      status={application.submission_status}
      review={enabled ? {
        userId: user.id, applicationId: application.id, expectedReviewedAt: application.reviewed_at,
      } : undefined}
      submitDecisionAction={enabled ? submitAdministrativeDecision : undefined}
    />}
  </main>;
}
