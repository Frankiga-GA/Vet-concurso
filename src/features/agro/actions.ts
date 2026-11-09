"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { createAgroFarmSchema, createAgroHerdSchema } from "./contract";

export type AgroActionState = {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function createAgroFarmAction(
  _prevState: AgroActionState | null,
  formData: FormData
): Promise<AgroActionState> {
  const { supabase } = await requireUser();

  const raw = {
    name: formData.get("name"),
    holding_type: formData.get("holding_type"),
    province: formData.get("province"),
    district: formData.get("district"),
    address_reference: formData.get("address_reference") || undefined,
    senasa_code: formData.get("senasa_code") || undefined,
  };

  const parsed = createAgroFarmSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: "Revisa los campos del formulario de explotación.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { error } = await supabase.rpc("vetia_create_my_agro_farm", {
    p_name: parsed.data.name,
    p_holding_type: parsed.data.holding_type,
    p_province: parsed.data.province,
    p_district: parsed.data.district,
    p_department: "Ica",
    p_address_reference: parsed.data.address_reference || null,
    p_senasa_code: parsed.data.senasa_code || null,
  });

  if (error) {
    return {
      success: false,
      error: "No se pudo registrar la explotación. Verifica tu conexión e inténtalo de nuevo.",
    };
  }

  revalidatePath("/account/agro");
  return { success: true };
}

export async function createAgroHerdAction(
  _prevState: AgroActionState | null,
  formData: FormData
): Promise<AgroActionState> {
  const { supabase } = await requireUser();

  const raw = {
    farm_id: formData.get("farm_id"),
    species: formData.get("species"),
    record_type: formData.get("record_type"),
    identifier: formData.get("identifier"),
    head_count: formData.get("head_count"),
    breed: formData.get("breed") || undefined,
    production_purpose: formData.get("production_purpose") || undefined,
    location_in_farm: formData.get("location_in_farm") || undefined,
    health_status: formData.get("health_status"),
    vaccines_applied: formData.get("vaccines_applied") || undefined,
    deworming_applied: formData.get("deworming_applied") || undefined,
    observations: formData.get("observations") || undefined,
  };

  const parsed = createAgroHerdSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: "Revisa los datos del animal o lote.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { error } = await supabase.rpc("vetia_create_my_agro_herd", {
    p_farm_id: parsed.data.farm_id,
    p_species: parsed.data.species,
    p_identifier: parsed.data.identifier,
    p_head_count: parsed.data.head_count,
    p_record_type: parsed.data.record_type,
    p_breed: parsed.data.breed || null,
    p_production_purpose: parsed.data.production_purpose || null,
    p_location_in_farm: parsed.data.location_in_farm || null,
    p_health_status: parsed.data.health_status,
    p_vaccines_applied: parsed.data.vaccines_applied || null,
    p_deworming_applied: parsed.data.deworming_applied || null,
    p_observations: parsed.data.observations || null,
  });

  if (error) {
    return {
      success: false,
      error: "No se pudo registrar el animal o lote pecuario. Inténtalo nuevamente.",
    };
  }

  revalidatePath("/account/agro");
  return { success: true };
}

export async function deleteAgroHerdAction(
  _prevState: AgroActionState | null,
  formData: FormData
): Promise<AgroActionState> {
  const { supabase } = await requireUser();
  const herdId = formData.get("herd_id")?.toString();

  if (!herdId) {
    return { success: false, error: "Identificador de lote no válido." };
  }

  const { error } = await supabase.rpc("vetia_delete_my_agro_herd", {
    p_herd_id: herdId,
  });

  if (error) {
    return { success: false, error: "No se pudo eliminar el registro pecuario." };
  }

  revalidatePath("/account/agro");
  return { success: true };
}
