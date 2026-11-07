"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";

export type PetFormResult = { status: "success" | "error"; message: string };

const ownerSchema = z.object({
  fullName: z.string().trim().min(2, "Ingresa tu nombre completo (mínimo 2 caracteres).").max(180, "El nombre completo admite hasta 180 caracteres."),
  phone: z.string().trim().max(32, "El teléfono admite hasta 32 caracteres.")
    .regex(/^(?:\+?[0-9 ()-]*[0-9][0-9 ()-]*)?$/, "Ingresa un teléfono válido."),
});

const petSchema = z.object({
  name: z.string().trim().min(1, "Ingresa el nombre de tu mascota.").max(120, "El nombre admite hasta 120 caracteres."),
  species: z.string().trim().min(2, "Ingresa una especie de al menos 2 caracteres.").max(60, "La especie admite hasta 60 caracteres."),
  breed: z.string().trim().max(120, "La raza admite hasta 120 caracteres."),
  sex: z.enum(["", "Hembra", "Macho"], { error: "Selecciona una opción válida para el sexo." }),
  birthDate: z.union([z.literal(""), z.iso.date()], { error: "Ingresa una fecha de nacimiento válida." })
    .refine((value) => value === "" || value <= new Date().toISOString().slice(0, 10), "La fecha de nacimiento no puede estar en el futuro."),
});

export async function saveOwner(formData: FormData): Promise<PetFormResult> {
  const { supabase } = await requireUser();
  const parsed = ownerSchema.safeParse({
    fullName: formData.get("fullName") ?? "",
    phone: formData.get("phone") ?? "",
  });
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0].message };

  const { error } = await supabase.rpc("vetia_upsert_my_owner", {
    p_full_name: parsed.data.fullName,
    p_phone: parsed.data.phone || null,
  });
  if (error) return { status: "error", message: "No pudimos guardar tu perfil. Inténtalo de nuevo." };
  return { status: "success", message: "Guardamos tu perfil. Ya puedes registrar mascotas." };
}

export async function createPet(formData: FormData): Promise<PetFormResult> {
  const { supabase } = await requireUser();
  const parsed = petSchema.safeParse({
    name: formData.get("name") ?? "",
    species: formData.get("species") ?? "",
    breed: formData.get("breed") ?? "",
    sex: formData.get("sex") ?? "",
    birthDate: formData.get("birthDate") ?? "",
  });
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0].message };

  const { name, species, breed, sex, birthDate } = parsed.data;
  const { error } = await supabase.rpc("vetia_create_my_pet", {
    p_name: name,
    p_species: species,
    p_breed: breed || null,
    p_sex: sex || null,
    p_birth_date: birthDate || null,
  });
  if (error?.code === "23503" && error.message === "Owner profile required") {
    return { status: "error", message: "Guarda primero tu perfil de propietario y vuelve a registrar la mascota." };
  }
  if (error) {
    return { status: "error", message: "No pudimos confirmar el registro. Revisa tu lista antes de volver a enviarlo." };
  }
  revalidatePath("/account/pets");
  return { status: "success", message: "Mascota registrada." };
}
