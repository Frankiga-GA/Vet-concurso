"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";

const allowedTypes = ["rep_identity", "sunarp_power", "sunat_ruc", "cmvp_license", "other"] as const;

export async function uploadApplicationDocument(formData: FormData) {
  const { supabase } = await requireUser();
  const applicationId = z.uuid().safeParse(formData.get("applicationId"));
  const documentType = z.enum(allowedTypes).safeParse(formData.get("documentType"));
  const file = formData.get("file");

  if (!applicationId.success || !documentType.success || !(file instanceof File)) {
    return { ok: false as const, message: "Datos o archivo no válidos." };
  }

  if (file.size <= 0 || file.size > 10 * 1024 * 1024) {
    return { ok: false as const, message: "El archivo no debe superar 10 MB." };
  }

  const allowedMime = ["application/pdf", "image/jpeg", "image/png"];
  if (!allowedMime.includes(file.type)) {
    return { ok: false as const, message: "Solo se admiten documentos en formato PDF, JPG o PNG." };
  }

  const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storagePath = `${applicationId.data}/${Date.now()}-${sanitizedName}`;

  // 1. Upload to private storage
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { error: storageError } = await supabase.storage
    .from("clinic-accreditation")
    .upload(storagePath, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (storageError) {
    return { ok: false as const, message: "No se pudo guardar el archivo en Storage seguro." };
  }

  // 2. Register catalog entry via secure RPC
  const { data: docId, error: rpcError } = await supabase.rpc("vetia_record_application_document", {
    p_application_id: applicationId.data,
    p_document_type: documentType.data,
    p_file_name: file.name,
    p_storage_path: storagePath,
    p_file_size: file.size,
    p_mime_type: file.type,
  });

  if (rpcError || !docId) {
    // If registration fails, remove orphaned object
    await supabase.storage.from("clinic-accreditation").remove([storagePath]);
    return { ok: false as const, message: rpcError?.message || "No se pudo registrar el documento." };
  }

  revalidatePath("/account/clinic-applications");
  revalidatePath(`/admin/clinic-applications/${applicationId.data}`);
  return { ok: true as const, message: "Documento adjuntado correctamente." };
}
