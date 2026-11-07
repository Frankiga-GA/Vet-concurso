import Link from "next/link";
import { z } from "zod";
import { logoutAction } from "@/app/auth/actions";
import { ApplicationForm } from "@/features/clinic-applications/application-form";
import { requireUser } from "@/lib/auth/session";

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

  return <main className="mx-auto min-h-screen max-w-4xl px-5 py-8 sm:py-12">
    <header className="flex flex-wrap items-center justify-between gap-3">
      <Link href="/account" className="text-sm font-semibold text-emerald-800 hover:underline">Volver a mi cuenta</Link>
      <form action={logoutAction}><button className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold">Cerrar sesión</button></form>
    </header>
    <h1 className="mt-8 text-3xl font-semibold">Registrar mi veterinaria</h1>
    <p className="mt-2 text-slate-600">Envía una solicitud de incorporación a VetIA.</p>
    <section aria-labelledby="new-application" className="mt-6 rounded-3xl bg-white p-5 shadow-sm sm:p-8">
      <h2 id="new-application" className="text-xl font-semibold">Nueva solicitud</h2>
      <ApplicationForm key={user.id} userId={user.id} />
    </section>
    <section aria-labelledby="my-applications" className="mt-6 rounded-3xl bg-white p-5 shadow-sm sm:p-8">
      <h2 id="my-applications" className="text-xl font-semibold">Mis solicitudes</h2>
      {error || !applications.success
        ? <p role="alert" className="mt-3 text-sm text-red-800">No pudimos cargar tus solicitudes. Recarga la página para volver a intentarlo.</p>
        : applications.data.length === 0
          ? <p className="mt-3 text-sm text-slate-600">Aún no tienes solicitudes.</p>
          : <ul className="mt-4 space-y-3">
            {applications.data.map((application) => <li key={application.id} className="rounded-2xl border border-slate-200 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h3 className="min-w-0 font-semibold wrap-break-word">{application.business_name}</h3>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-900">
                  {statusLabels[application.submission_status]}
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-600">
                {application.city} · <time dateTime={application.submitted_at}>{dateFormatter.format(new Date(application.submitted_at))}</time>
              </p>
              {application.decision_message && <p className="mt-2 text-sm wrap-break-word text-slate-700">{application.decision_message}</p>}
            </li>)}
          </ul>}
    </section>
  </main>;
}
