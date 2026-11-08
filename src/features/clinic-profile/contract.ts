import { z } from "zod";

export const cities = ["Chincha", "Pisco", "Ica"] as const;
export const days = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"] as const;
export const fieldLabels = {
  name: "Nombre público", address: "Dirección", city: "Ciudad", phone: "Teléfono público",
  description: "Descripción", services: "Servicios", hours: "Horarios",
};

const slot = z.strictObject({
  day: z.number().int().min(1).max(7),
  start: z.string().regex(/^([01][0-9]|2[0-3]):[0-5][0-9]$/),
  end: z.string().regex(/^(([01][0-9]|2[0-3]):[0-5][0-9]|24:00)$/),
});

const hours = z.array(slot).max(28).superRefine((slots, context) => {
  const ordered = [...slots].sort((a, b) => a.day - b.day || a.start.localeCompare(b.start));
  for (const [index, current] of ordered.entries()) {
    const previous = ordered[index - 1];
    if (current.start >= current.end || (previous?.day === current.day && previous.end > current.start)) {
      context.addIssue({ code: "custom", message: "Los turnos deben terminar después de empezar y no solaparse." });
      return;
    }
  }
});

function cleanText(min: number, max: number, multiline = false) {
  return z.string().trim().min(min).max(max)
    .refine((value) => !/\p{Cc}/u.test(multiline ? value.replaceAll("\n", "") : value));
}

export const profileInput = z.object({
  revision: z.number().int().min(0).max(2147483647),
  name: cleanText(2, 120),
  address: cleanText(5, 200).nullable(),
  city: z.enum(cities),
  phone: z.string().regex(/^\+?[0-9]{6,15}$/).nullable(),
  description: cleanText(10, 1200, true).nullable(),
  services: z.array(cleanText(2, 80)).max(20)
    .refine((values) => new Set(values.map((value) => value.toLowerCase())).size === values.length),
  hours,
});

export const profileSnapshot = z.object({
  name: z.string(), address: z.string().nullable(), city: z.enum(cities), phone: z.string().nullable(),
  description: z.string().nullable(), services: z.array(z.string()), hours: z.array(slot),
  revision: z.number().int().nonnegative(), publication: z.enum(["unpublished", "published", "withdrawn"]),
  missing: z.array(z.enum(["name", "address", "city", "phone", "description", "services", "hours"])),
});

export type ClinicProfile = z.infer<typeof profileSnapshot>;
export type ProfileResult = { message?: string; profile: ClinicProfile; invalid?: keyof typeof fieldLabels };
