import { z } from "zod";

export const AGRO_SPECIES = ["bovino", "porcino", "ovino", "caprino", "ave"] as const;
export type AgroSpecies = (typeof AGRO_SPECIES)[number];

export const AGRO_HOLDING_TYPES = [
  "lecheria",
  "engorde",
  "porcicola",
  "avicola",
  "ovino_caprino",
  "mixto",
  "traspatio",
] as const;
export type AgroHoldingType = (typeof AGRO_HOLDING_TYPES)[number];

export const AGRO_HEALTH_STATUSES = [
  "aparentemente_sano",
  "en_tratamiento",
  "en_observacion",
  "cuarentena",
] as const;
export type AgroHealthStatus = (typeof AGRO_HEALTH_STATUSES)[number];

export const agroFarmSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2).max(160),
  holding_type: z.enum(AGRO_HOLDING_TYPES),
  department: z.string().default("Ica"),
  province: z.enum(["Chincha", "Pisco", "Ica", "Palpa", "Nasca"]),
  district: z.string().min(2).max(100),
  address_reference: z.string().nullable().optional(),
  senasa_code: z.string().nullable().optional(),
  created_at: z.string(),
});
export type AgroFarm = z.infer<typeof agroFarmSchema>;

export const agroFarmListSchema = z.array(agroFarmSchema);

export const createAgroFarmSchema = z.object({
  name: z.string().trim().min(2, "El nombre del predio debe tener al menos 2 caracteres").max(160),
  holding_type: z.enum(AGRO_HOLDING_TYPES, {
    message: "Selecciona un tipo de explotación válido",
  }),
  province: z.enum(["Chincha", "Pisco", "Ica", "Palpa", "Nasca"], {
    message: "Selecciona una provincia válida",
  }),
  district: z.string().trim().min(2, "Indica el distrito o localidad").max(100),
  address_reference: z.string().trim().max(250).optional().or(z.literal("")),
  senasa_code: z.string().trim().max(50).optional().or(z.literal("")),
});
export type CreateAgroFarmInput = z.infer<typeof createAgroFarmSchema>;

export const agroHerdSchema = z.object({
  id: z.string().uuid(),
  farm_id: z.string().uuid(),
  farm_name: z.string(),
  species: z.enum(AGRO_SPECIES),
  record_type: z.enum(["individual", "lote"]),
  identifier: z.string().min(1).max(120),
  head_count: z.number().int().min(1),
  breed: z.string().nullable().optional(),
  production_purpose: z.string().nullable().optional(),
  location_in_farm: z.string().nullable().optional(),
  health_status: z.enum(AGRO_HEALTH_STATUSES),
  vaccines_applied: z.string().nullable().optional(),
  deworming_applied: z.string().nullable().optional(),
  observations: z.string().nullable().optional(),
  created_at: z.string(),
});
export type AgroHerd = z.infer<typeof agroHerdSchema>;

export const agroHerdListSchema = z.array(agroHerdSchema);

export const createAgroHerdSchema = z.object({
  farm_id: z.string().uuid({ message: "Selecciona una explotación válida" }),
  species: z.enum(AGRO_SPECIES, {
    message: "Selecciona una especie productiva válida",
  }),
  record_type: z.enum(["individual", "lote"]).default("lote"),
  identifier: z.string().trim().min(1, "Indica el arete, código o nombre del lote").max(120),
  head_count: z.coerce.number().int().min(1, "Debe ser al menos 1 cabeza o ave"),
  breed: z.string().trim().max(100).optional().or(z.literal("")),
  production_purpose: z.string().trim().max(100).optional().or(z.literal("")),
  location_in_farm: z.string().trim().max(100).optional().or(z.literal("")),
  health_status: z.enum(AGRO_HEALTH_STATUSES).default("aparentemente_sano"),
  vaccines_applied: z.string().trim().max(300).optional().or(z.literal("")),
  deworming_applied: z.string().trim().max(300).optional().or(z.literal("")),
  observations: z.string().trim().max(500).optional().or(z.literal("")),
});
export type CreateAgroHerdInput = z.infer<typeof createAgroHerdSchema>;
