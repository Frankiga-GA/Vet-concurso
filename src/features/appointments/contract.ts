import { z } from "zod";

export const cities = ["Chincha", "Pisco", "Ica"] as const;
export const directoryClinic = z.object({
  id: z.uuid(), slug: z.string(), name: z.string(), city: z.enum(cities),
  address: z.string(), phone: z.string(), description: z.string().nullable(),
});
export const appointment = z.object({
  id: z.uuid(), reference: z.uuid(), contact_name: z.string(), contact_phone: z.string(),
  reason: z.string(), status: z.enum(["pending", "confirmed"]),
  preferred_at: z.iso.datetime({ offset: true }), agreed_at: z.iso.datetime({ offset: true }).nullable(),
});

export const limaDateTime = new Intl.DateTimeFormat("es-PE", {
  dateStyle: "medium", timeStyle: "short", timeZone: "America/Lima",
});

export function parseLimaTime(value: unknown, now = Date.now()) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
  if (!z.iso.datetime({ local: true, precision: -1 }).safeParse(value).success) return null;
  const date = new Date(`${value}:00-05:00`);
  if (!Number.isFinite(date.getTime()) || date.getTime() <= now || date.getTime() > now + 90 * 86400_000) return null;
  return date.toISOString();
}

export const requestFields = z.object({
  clinicId: z.uuid(),
  requestKey: z.uuid(),
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().max(32).regex(/^\+?[0-9 ()-]+$/).transform((p) => {
    const normalized = p.replace(/[ ()-]/g, "");
    return /^9\d{8}$/.test(normalized) ? `+51${normalized}`
      : /^51\d{9}$/.test(normalized) ? `+${normalized}` : normalized;
  }).pipe(z.string().regex(/^\+?[0-9]{6,15}$/)),
  reason: z.string().trim().min(5).max(500),
  preferred: z.string(),
  token: z.string().min(1).max(2048),
});

export type AppointmentResult = {
  message: string;
  reference?: string;
  fields?: Partial<Record<"name" | "phone" | "reason" | "preferred", string>>;
};
