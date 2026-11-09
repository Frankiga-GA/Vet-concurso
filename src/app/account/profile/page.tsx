import { z } from "zod";
import { logoutAction } from "@/app/auth/actions";
import { OwnerNav, Notice, PageIntro, PublicHeader } from "@/components/vetia-ui";
import { ProfileForm } from "@/features/profile/profile-form";
import { requireUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

const profileSchema = z.object({ first_name: z.string().nullable(), last_name: z.string().nullable(), phone: z.string().nullable(), city: z.string().nullable() });

export default async function MyProfilePage() {
  const { supabase } = await requireUser();
  const { data, error } = await supabase.rpc("vetia_my_profile").maybeSingle();
  const profile = profileSchema.nullable().safeParse(data);
  return <><PublicHeader current="account" /><main className="vet-shell vet-page space-y-6">
    <OwnerNav current="profile" />
    <div className="flex flex-wrap items-start justify-between gap-4"><PageIntro title="Mi perfil" label="Mi cuenta"><p>Actualiza tus datos personales y la ciudad desde la que usas VetIA.</p></PageIntro><form action={logoutAction}><button className="vet-button vet-button-secondary">Cerrar sesión</button></form></div>
    <section className="vet-card max-w-3xl"><h2 className="vet-card-title">Datos personales</h2><p className="vet-muted mt-2 text-sm">Estos datos no aparecen en el directorio público.</p>
      {error || !profile.success ? <Notice tone="danger" role="alert">No pudimos cargar tu perfil. Recarga la página antes de editarlo.</Notice> : <ProfileForm profile={profile.data} />}
    </section>
  </main></>;
}
