import Link from "next/link";
import { z } from "zod";
import { requirePlatformAdminAal2 } from "@/lib/auth/session";
import { applicationReadError } from "@/features/clinic-applications/admin-read";
import {
  adminApplicationsHref, adminApplicationsPath, applicationDateFormatter, applicationStatuses,
  applicationSummary, maxPage, pageSize, parseAdminQuery, statusLabels, summaryColumns,
} from "@/features/clinic-applications/admin-query";

export const dynamic = "force-dynamic";

const filters = [...applicationStatuses, "all"] as const;
const linkClass = "rounded-full border border-emerald-800 px-4 py-2 text-sm font-semibold text-emerald-900 hover:bg-emerald-50";

export default async function AdminClinicApplicationsPage({ searchParams }: {
  searchParams: Promise<{ status?: string | string[]; page?: string | string[] }>;
}) {
  const { supabase } = await requirePlatformAdminAal2();
  const { filter, page, from, to } = parseAdminQuery(await searchParams);
  let query = supabase.from("clinic_applications").select(summaryColumns);
  if (filter !== "all") query = query.eq("submission_status", filter);
  const { data, error, status } = await query
    .order("submitted_at", { ascending: false })
    .order("id", { ascending: false })
    .range(from, to);
  const outsideRange = status === 416 && error?.code === "PGRST103" && page > 1;
  const parsed = z.array(applicationSummary).safeParse(outsideRange ? [] : data);
  const message = (error && !outsideRange) || !parsed.success ? applicationReadError(status) : null;
  const rows = parsed.success ? parsed.data : [];

  return <main className="mx-auto max-w-5xl px-5 py-8 sm:py-12">
    <Link href="/admin" className="text-sm font-semibold text-emerald-800 hover:underline">Volver al panel</Link>
    <h1 className="mt-6 text-3xl font-semibold">Solicitudes de veterinarias</h1>
    <nav aria-label="Filtrar por estado" className="mt-5 flex flex-wrap gap-2">
      {filters.map((item) => <Link key={item} href={adminApplicationsHref(item)} aria-current={filter === item ? "page" : undefined}
        className={filter === item ? "rounded-full bg-emerald-800 px-4 py-2 text-sm font-semibold text-white" : linkClass}>
        {item === "all" ? "Todas" : statusLabels[item]}
      </Link>)}
    </nav>
    <section aria-label="Resultados" className="mt-6 rounded-3xl bg-white p-5 shadow-sm sm:p-8">
      {message ? <p role="alert" className="text-sm text-rose-800">{message}</p>
        : rows.length === 0 ? <p className="text-sm text-slate-600">
          {page === 1 ? "No hay solicitudes para este filtro." : "No hay solicitudes en esta página."}
        </p>
        : <ul className="grid gap-3 sm:grid-cols-2">
          {rows.slice(0, pageSize).map((row) => <li key={row.id} className="min-w-0 rounded-2xl border border-slate-200 p-4">
            <Link href={`${adminApplicationsPath}/${row.id}`} className="font-semibold wrap-break-word text-emerald-900 hover:underline">
              {row.business_name}
            </Link>
            <p className="mt-1 text-sm text-slate-600">{row.city} · {statusLabels[row.submission_status]}</p>
            <p className="mt-2 text-sm wrap-break-word text-slate-700">{row.contact_name} · {row.contact_email} · {row.contact_phone}</p>
            <time className="mt-2 block text-sm text-slate-600" dateTime={row.submitted_at}>{applicationDateFormatter.format(new Date(row.submitted_at))}</time>
          </li>)}
        </ul>}
      {!message && (page > 1 || rows.length > pageSize) && <nav aria-label="Paginación" className="mt-5 flex flex-wrap items-center gap-3">
        {page > 1 && <Link className={linkClass} href={adminApplicationsHref(filter, page - 1)}>Anterior</Link>}
        <span className="text-sm text-slate-600">Página {page}</span>
        {rows.length > pageSize && page < maxPage && <Link className={linkClass} href={adminApplicationsHref(filter, page + 1)}>Siguiente</Link>}
        {page > 2 && rows.length === 0 && <Link className={linkClass} href={adminApplicationsHref(filter)}>Primera página</Link>}
      </nav>}
    </section>
  </main>;
}
