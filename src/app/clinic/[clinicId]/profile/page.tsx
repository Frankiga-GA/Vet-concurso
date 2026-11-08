import { notFound } from "next/navigation";
import { z } from "zod";
import { requireClinicMembership } from "@/lib/auth/clinic";
import { profileSnapshot } from "@/features/clinic-profile/contract";
import { ClinicProfileForm } from "@/features/clinic-profile/profile-form";
import { saveClinicProfile } from "./actions";
import { ClinicNav, Notice, PageIntro } from "@/components/vetia-ui";

export const dynamic = "force-dynamic";

export default async function ClinicProfilePage({ params }: { params: Promise<{ clinicId: string }> }) {
  const { clinicId } = await params;
  if (!z.uuid().safeParse(clinicId).success) notFound();
  const { supabase, membership } = await requireClinicMembership(clinicId);
  if (membership.role !== "clinic_admin") notFound();
  const { data, error } = await supabase.rpc("vetia_get_clinic_profile", { p_clinic_id: clinicId });
  if (error?.code === "42501" || (!error && data === null)) notFound();
  const profile = profileSnapshot.safeParse(data);
  return <main className="vet-shell vet-page vet-narrow space-y-4">
    <ClinicNav clinicId={clinicId} current="profile" profile />
    <PageIntro title="Perfil de la veterinaria"><p>Prepara la ficha pública. La publicación requiere una autorización aparte.</p></PageIntro>
    {error || !profile.success
      ? <Notice tone="danger" role="alert">No se pudo cargar el perfil. Intenta recargar la página.</Notice>
      : <ClinicProfileForm profile={profile.data} action={saveClinicProfile.bind(null, clinicId)} />}
  </main>;
}
