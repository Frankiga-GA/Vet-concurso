"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";

const profileSchema = z.object({
  firstName: z.string().trim().min(2, "Ingresa tus nombres.").max(80),
  lastName: z.string().trim().min(2, "Ingresa tus apellidos.").max(120),
  phone: z.string().trim().max(32).regex(/^(?:\+?[0-9 ()-]*[0-9][0-9 ()-]*)?$/, "Ingresa un teléfono válido."),
  city: z.enum(["Chincha", "Pisco", "Ica"], { message: "Selecciona Chincha, Pisco o Ica." }),
  accountType: z.enum(["mascotas", "agro"]).default("mascotas"),
});

export async function saveMyProfile(formData: FormData) {
  const accountTypeRaw = formData.get("accountType")?.toString();
  const accountType = accountTypeRaw === "agro" ? "agro" : "mascotas";

  const parsed = profileSchema.safeParse({
    firstName: formData.get("firstName") ?? "",
    lastName: formData.get("lastName") ?? "",
    phone: formData.get("phone") ?? "",
    city: formData.get("city") ?? "",
    accountType,
  });
  if (!parsed.success) return { ok: false as const, message: parsed.error.issues[0].message };
  const { supabase } = await requireUser();
  const { error } = await supabase.rpc("vetia_update_my_profile", {
    p_first_name: parsed.data.firstName,
    p_last_name: parsed.data.lastName,
    p_phone: parsed.data.phone || null,
    p_city: parsed.data.city,
    p_account_type: parsed.data.accountType,
  });
  if (error) return { ok: false as const, message: "No pudimos guardar tu perfil. Inténtalo nuevamente." };
  revalidatePath("/account");
  revalidatePath("/account/profile");
  revalidatePath("/account/pets");
  revalidatePath("/account/agro");
  return { ok: true as const, message: "Tu perfil fue actualizado." };
}
