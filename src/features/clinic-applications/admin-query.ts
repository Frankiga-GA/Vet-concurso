import { z } from "zod";
import { reviewTimestamp } from "./decision-contract";

export const applicationStatuses = ["submitted", "needs_information", "approved", "rejected"] as const;
export const statusLabels = {
  submitted: "Enviada",
  needs_information: "En espera de información",
  approved: "Aprobada",
  rejected: "Rechazada",
} satisfies Record<(typeof applicationStatuses)[number], string>;

const filterSchema = z.enum(["all", ...applicationStatuses]);
type Filter = z.infer<typeof filterSchema>;

export const pageSize = 20;
export const maxPage = 10_000;
export const adminApplicationsPath = "/admin/clinic-applications";

export function parseAdminQuery(params: { status?: unknown; page?: unknown }) {
  const filter = filterSchema.catch("submitted").parse(params.status);
  const rawPage = typeof params.page === "string" && /^[1-9]\d{0,4}$/.test(params.page)
    ? Number(params.page)
    : 1;
  const page = rawPage <= maxPage ? rawPage : 1;
  const from = (page - 1) * pageSize;
  // PostgREST ranges are inclusive. Fetch an extra row to detect a next page.
  return { filter, page, from, to: from + pageSize };
}

export function adminApplicationsHref(filter: Filter, page = 1) {
  const query = new URLSearchParams({ status: filter });
  if (page > 1) query.set("page", String(page));
  return `${adminApplicationsPath}?${query}`;
}

export const summaryColumns = "id,business_name,city,contact_name,contact_email,contact_phone,submission_status,submitted_at";

export const applicationSummary = z.object({
  id: z.uuid(),
  business_name: z.string(),
  city: z.string(),
  contact_name: z.string(),
  contact_email: z.string(),
  contact_phone: z.string(),
  submission_status: z.enum(applicationStatuses),
  submitted_at: z.iso.datetime({ offset: true }),
});

export const applicationDetail = applicationSummary.extend({
  decision_message: z.string().nullable(),
  reviewed_at: reviewTimestamp.nullable(),
});

export const applicationDateFormatter = new Intl.DateTimeFormat("es-PE", {
  dateStyle: "medium", timeStyle: "short", timeZone: "America/Lima",
});
