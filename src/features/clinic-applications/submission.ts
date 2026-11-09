import { z } from "zod";

export const cities = ["Chincha", "Pisco", "Ica"] as const;
export const submissionKeySchema = z.uuid();

const applicationSchema = z.object({
  businessName: z.string().trim().min(2, "Ingresa el nombre comercial (mínimo 2 caracteres).").max(180, "El nombre comercial admite hasta 180 caracteres."),
  legalName: z.string().trim().min(2, "Ingresa la razón social.").max(180, "La razón social admite hasta 180 caracteres."),
  ruc: z.string().trim().regex(/^\d{11}$/, "El RUC debe tener 11 dígitos."),
  city: z.enum(cities, { error: "Selecciona Chincha, Pisco o Ica." }),
  address: z.string().trim().min(5, "Ingresa la dirección del establecimiento.").max(200, "La dirección admite hasta 200 caracteres."),
  contactName: z.string().trim().min(2, "Ingresa el nombre de contacto (mínimo 2 caracteres).").max(120, "El nombre de contacto admite hasta 120 caracteres."),
  contactEmail: z.string().trim().toLowerCase().max(254).pipe(z.email({ error: "Ingresa un correo de contacto válido." })),
  contactPhone: z.string().trim().min(6, "Ingresa un teléfono de contacto válido.").max(32, "El teléfono admite hasta 32 caracteres.")
    .refine((phone) => /^\+?[\d ()-]+$/.test(phone) && phone.replace(/\D/g, "").length >= 6, "Ingresa un teléfono con al menos 6 dígitos."),
  legalRepresentativeName: z.string().trim().min(2, "Ingresa el nombre del responsable legal.").max(120, "El nombre admite hasta 120 caracteres."),
  legalRepresentativeDocument: z.string().trim().regex(/^[A-Za-z0-9-]{8,20}$/, "Ingresa un documento válido de 8 a 20 caracteres."),
  veterinarianName: z.string().trim().min(2, "Ingresa el nombre del veterinario responsable.").max(120, "El nombre admite hasta 120 caracteres."),
  veterinarianLicense: z.string().trim().regex(/^[A-Za-z0-9-]{3,40}$/, "Ingresa una colegiatura válida."),
  declarationAcknowledged: z.preprocess(
    (val) => val === "true" || val === "on" || val === true || val === "1",
    z.boolean()
  ).refine((val) => val === true, "Debes declarar bajo juramento ser propietario o representante legal autorizado."),
  services: z.array(z.string().trim().min(2).max(80)).min(1, "Incluye al menos un servicio.").max(20, "Incluye hasta 20 servicios.")
    .refine((services) => new Set(services.map((item) => item.toLowerCase())).size === services.length, "No repitas servicios."),
  openingHours: z.array(z.object({ day: z.number().int().min(0).max(6), start: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/), end: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/) }))
    .min(1, "Agrega al menos un horario.").max(14, "Incluye hasta 14 horarios.")
    .refine((hours) => hours.every((hour) => hour.start < hour.end), "Cada horario debe terminar después de iniciar."),
});

export function parseApplication(data: FormData) {
  return applicationSchema.safeParse({
    businessName: data.get("businessName"),
    legalName: data.get("legalName"),
    ruc: data.get("ruc"),
    city: data.get("city"),
    address: data.get("address"),
    contactName: data.get("contactName"),
    contactEmail: data.get("contactEmail"),
    contactPhone: data.get("contactPhone"),
    legalRepresentativeName: data.get("legalRepresentativeName"),
    legalRepresentativeDocument: data.get("legalRepresentativeDocument"),
    veterinarianName: data.get("veterinarianName"),
    veterinarianLicense: data.get("veterinarianLicense"),
    declarationAcknowledged: data.get("declarationAcknowledged"),
    services: String(data.get("services") ?? "").split(/\r?\n|,/).map((item) => item.trim()).filter(Boolean),
    openingHours: (() => {
      try { return JSON.parse(String(data.get("openingHours") ?? "[]")); } catch { return []; }
    })(),
  });
}

export async function submissionSlot(userId: string, application: z.infer<typeof applicationSchema>) {
  const payload = JSON.stringify(application);
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(payload));
  const fingerprint = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `vetia:clinic-application:${userId}:${fingerprint}`;
}

export function createSubmissionKeys(storage: Pick<Storage, "getItem" | "setItem" | "removeItem"> | undefined) {
  const pending = new Map<string, string>();
  return {
    get(slot: string) {
      if (pending.has(slot)) return pending.get(slot)!;
      let saved: string | null | undefined;
      try { saved = storage?.getItem(slot); } catch { /* Use in-memory storage. */ }
      const valid = submissionKeySchema.safeParse(saved);
      const key = valid.success ? valid.data : crypto.randomUUID();
      pending.set(slot, key);
      try { storage?.setItem(slot, key); } catch { /* Use in-memory storage. */ }
      return key;
    },
    complete(slot: string) {
      pending.delete(slot);
      try { storage?.removeItem(slot); } catch { /* The confirmed request remains safe to retry. */ }
    },
  };
}
