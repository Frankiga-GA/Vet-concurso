import Link from "next/link";
import { z } from "zod";
import { requirePlatformAdminAal2 } from "@/lib/auth/session";
import { applicationReadError } from "@/features/clinic-applications/admin-read";
import { AdminNav, Notice, PageIntro } from "@/components/vetia-ui";
import {
  adminApplicationsHref, adminApplicationsPath, applicationDateFormatter, applicationStatuses,
  applicationSummary, maxPage, pageSize, parseAdminQuery, statusLabels, summaryColumns,
} from "@/features/clinic-applications/admin-query";

export const dynamic = "force-dynamic";

const filters = [...applicationStatuses, "all"] as const;
const linkClass = "vet-button vet-button-secondary text-sm";

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

  return <main className="vet-shell vet-page space-y-6">
    <AdminNav current="applications" />
    <div className="grid items-end gap-4 md:grid-cols-[1fr_auto]"><PageIntro title="Solicitudes de veterinarias" label="Superadministración"><p>Revisa la información enviada y abre cada expediente para continuar el proceso.</p></PageIntro><span className="vet-kicker">Bandeja de revisión</span></div>
    <nav aria-label="Filtrar por estado" className="flex flex-wrap gap-2">
      {filters.map((item) => <Link key={item} href={adminApplicationsHref(item)} aria-current={filter === item ? "page" : undefined}
        className="vet-button vet-filter">
        {item === "all" ? "Todas" : statusLabels[item]}
      </Link>)}
    </nav>
    <section aria-label="Resultados" className="vet-card vet-card-elevated">
      {message ? <Notice tone="danger" role="alert">{message}</Notice>
        : rows.length === 0 ? <div className="vet-empty"><span className="vet-empty-icon">▤</span><h2 className="vet-card-title">{page === 1 ? "No hay solicitudes para este filtro" : "No hay solicitudes en esta página"}</h2><p className="vet-muted text-sm">Cuando una veterinaria envíe su incorporación aparecerá en esta bandeja.</p></div>
        : <ul className="grid gap-3 sm:grid-cols-2">
          {rows.slice(0, pageSize).map((row) => <li key={row.id} className="min-w-0 rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-4">
            <div className="flex items-start justify-between gap-3"><span className="vet-icon-tile">✚</span><span className={`vet-badge ${row.submission_status === "rejected" ? "vet-badge-danger" : row.submission_status === "approved" ? "" : "vet-badge-pending"}`}>{statusLabels[row.submission_status]}</span></div>
            <Link href={`${adminApplicationsPath}/${row.id}`} className="mt-3 block text-lg font-bold wrap-break-word">
              {row.business_name} <span className="text-[var(--green)]">→</span>
            </Link>
            <p className="vet-muted mt-1 text-sm">⌖ {row.city}</p>
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
