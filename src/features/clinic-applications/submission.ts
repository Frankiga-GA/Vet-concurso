import { z } from "zod";

export const cities = ["Chincha", "Pisco", "Ica"] as const;
export const submissionKeySchema = z.uuid();

const applicationSchema = z.object({
  businessName: z.string().trim().min(2, "Ingresa el nombre comercial (mínimo 2 caracteres).").max(180, "El nombre comercial admite hasta 180 caracteres."),
  city: z.enum(cities, { error: "Selecciona Chincha, Pisco o Ica." }),
  contactName: z.string().trim().min(2, "Ingresa el nombre de contacto (mínimo 2 caracteres).").max(120, "El nombre de contacto admite hasta 120 caracteres."),
  contactEmail: z.string().trim().toLowerCase().max(254).pipe(z.email({ error: "Ingresa un correo de contacto válido." })),
  contactPhone: z.string().trim().min(6, "Ingresa un teléfono de contacto válido.").max(32, "El teléfono admite hasta 32 caracteres.")
    .refine((phone) => /^\+?[\d ()-]+$/.test(phone) && phone.replace(/\D/g, "").length >= 6, "Ingresa un teléfono con al menos 6 dígitos."),
});

export function parseApplication(data: FormData) {
  return applicationSchema.safeParse({
    businessName: data.get("businessName"),
    city: data.get("city"),
    contactName: data.get("contactName"),
    contactEmail: data.get("contactEmail"),
    contactPhone: data.get("contactPhone"),
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
