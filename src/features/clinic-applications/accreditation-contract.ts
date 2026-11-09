import { z } from "zod";

export const documentTypeLabels = {
  rep_identity: "Documento de identidad (DNI / CE)",
  sunarp_power: "Vigencia de poder (SUNARP)",
  sunat_ruc: "Ficha RUC (SUNAT)",
  cmvp_license: "Habilitación profesional (CMVP)",
  other: "Otro sustento",
} as const;

export const applicationDocumentSchema = z.object({
  id: z.uuid(),
  document_type: z.enum(["rep_identity", "sunarp_power", "sunat_ruc", "cmvp_license", "other"]),
  file_name: z.string(),
  storage_path: z.string(),
  file_size: z.number().int().positive(),
  mime_type: z.enum(["application/pdf", "image/jpeg", "image/png"]),
  created_at: z.string(),
});

export type ApplicationDocument = z.infer<typeof applicationDocumentSchema>;

export const accreditationSchema = z.object({
  application_id: z.uuid(),
  sunat_verified: z.boolean(),
  sunat_status: z.enum(["activo_habido", "activo_no_habido", "no_hallado", "baja", "invalido"]).nullable(),
  sunat_notes: z.string().nullable(),
  sunat_verified_at: z.string().nullable(),

  sunarp_required: z.boolean(),
  sunarp_verified: z.boolean(),
  sunarp_entry: z.string().nullable(),
  sunarp_notes: z.string().nullable(),
  sunarp_verified_at: z.string().nullable(),

  cmvp_verified: z.boolean(),
  cmvp_license_status: z.enum(["habilitado", "no_habilitado", "no_encontrado"]).nullable(),
  cmvp_notes: z.string().nullable(),
  cmvp_verified_at: z.string().nullable(),

  status: z.enum(["pending_review", "corrections_requested", "verified", "rejected"]),
  correction_notes: z.string().nullable(),
  verified_by: z.string().nullable(),
  verified_at: z.string().nullable(),
  is_representation_active: z.boolean(),
});

export type AccreditationDetails = z.infer<typeof accreditationSchema>;
