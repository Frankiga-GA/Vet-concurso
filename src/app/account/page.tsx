import { redirect } from "next/navigation";
import Link from "next/link";
import { logoutAction } from "@/app/auth/actions";
import { requireUser } from "@/lib/auth/session";
import { PageIntro, PublicHeader } from "@/components/vetia-ui";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const { user, supabase } = await requireUser();
  const { data: isAdmin } = await supabase.rpc("vetia_is_platform_admin");
  if (isAdmin) {
    const { data: assurance } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    redirect(assurance?.currentLevel === "aal2" ? "/admin" : "/admin/mfa");
  }
  return <>
    <PublicHeader current="account" />
    <main className="vet-shell vet-page space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageIntro title="Mi cuenta"><p className="wrap-break-word">{user.email ?? "Sin correo"}</p></PageIntro>
        <form action={logoutAction}><button className="vet-button vet-button-secondary">Cerrar sesión</button></form>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <section className="vet-card space-y-3">
          <h2 className="text-xl font-bold">Mis mascotas</h2>
          <p className="vet-muted">Registra y consulta las fichas de tus mascotas.</p>
          <Link href="/account/pets" className="vet-button vet-button-primary">Abrir mis mascotas</Link>
        </section>
        <section className="vet-card space-y-3">
          <h2 className="text-xl font-bold">Incorporación de veterinarias</h2>
          <p className="vet-muted">Envía una solicitud o consulta el estado de una que ya registraste.</p>
          <Link href="/account/clinic-applications" className="vet-button vet-button-secondary">Registrar mi veterinaria</Link>
        </section>
      </div>
    </main>
  </>;
}
