"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireClinicRecords } from "@/features/clinic-records/access";
import { clientInput, listedClient, patientInput, searchInput, type RecordResult, type SearchResult } from "@/features/clinic-records/contract";

function fields(form: FormData) {
  const read = (name: string) => form.get(name)?.toString().trim() ?? "";
  return { read, recordId: read("recordId"), name: read("name"), allowSimilar: read("allowSimilar") === "yes" };
}

function failed(error: { code?: string; message?: string } | null, kind: "client" | "patient"): RecordResult {
  if (error?.code === "PT409" && error.message === `Similar clinic ${kind} exists`) {
    return { similar: true, message: "Ya existe un registro parecido. Verifica los datos antes de crear otro." };
  }
  if (error?.code === "PT409") return { message: "Este intento ya se utilizó. Recarga el formulario." };
  if (error?.code === "42501" || error?.code === "PT404") return { message: "La ficha ya no está disponible para tu cuenta." };
  if (error?.code === "22023") return { message: "Revisa los datos ingresados." };
  return { message: "No pudimos comprobar el alta. Reintenta con los mismos datos." };
}

export async function searchClinicClients(clinicId: string, _previous: SearchResult, form: FormData): Promise<SearchResult> {
  const { supabase } = await requireClinicRecords(clinicId);
  const query = searchInput.safeParse(form.get("intent") === "clear" ? "" : form.get("query"));
  if (!query.success) return { rows: [], message: "Escribe hasta 120 caracteres para buscar." };
  const { data, error } = await supabase.rpc("vetia_search_clinic_clients", { p_clinic_id: clinicId, p_query: query.data });
  const parsed = z.array(listedClient).safeParse(data);
  return !error && parsed.success ? { rows: parsed.data } : { rows: [], message: "No se pudo cargar la búsqueda." };
}

export async function createClinicClient(clinicId: string, _previous: RecordResult, form: FormData): Promise<RecordResult> {
  const { supabase } = await requireClinicRecords(clinicId);
  const { read, ...base } = fields(form);
  const parsed = clientInput.safeParse({ ...base, phone: read("phone"), email: read("email") });
  if (!parsed.success) return { message: "Revisa el nombre, el teléfono y el correo opcional." };
  const item = parsed.data;
  const { data, error } = await supabase.rpc("vetia_create_clinic_client", {
    p_clinic_id: clinicId, p_id: item.recordId, p_name: item.name, p_phone: item.phone,
    p_email: item.email, p_allow_similar: item.allowSimilar,
  });
  if (error || data !== item.recordId) return failed(error, "client");
  revalidatePath(`/clinic/${clinicId}/clients`);
  redirect(`/clinic/${clinicId}/clients/${item.recordId}`);
}

export async function createClinicPatient(clinicId: string, clientId: string, _previous: RecordResult, form: FormData): Promise<RecordResult> {
  const { supabase } = await requireClinicRecords(clinicId);
  if (!z.uuid().safeParse(clientId).success) return { message: "La ficha del cliente no está disponible." };
  const { read, ...base } = fields(form);
  const parsed = patientInput.safeParse({
    ...base, species: read("species"), breed: read("breed"), sex: read("sex"), birthDate: read("birthDate"),
  });
  if (!parsed.success) return { message: "Revisa el nombre, la especie y la fecha de nacimiento." };
  const item = parsed.data;
  const { data, error } = await supabase.rpc("vetia_create_clinic_patient", {
    p_clinic_id: clinicId, p_client_id: clientId, p_id: item.recordId, p_name: item.name,
    p_species: item.species, p_breed: item.breed, p_sex: item.sex, p_birth_date: item.birthDate, p_allow_similar: item.allowSimilar,
  });
  if (error || data !== item.recordId) return failed(error, "patient");
  revalidatePath(`/clinic/${clinicId}/clients/${clientId}`);
  redirect(`/clinic/${clinicId}/clients/${clientId}#pacientes`);
}
