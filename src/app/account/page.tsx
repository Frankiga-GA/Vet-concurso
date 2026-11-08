import { redirect } from "next/navigation";
import Link from "next/link";
import { logoutAction } from "@/app/auth/actions";
import { requireUser } from "@/lib/auth/session";
import { Notice, PageIntro, PublicHeader } from "@/components/vetia-ui";

export const dynamic = "force-dynamic";

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ notice?: string }> }) {
  const { user, supabase } = await requireUser();
  const { data: isAdmin } = await supabase.rpc("vetia_is_platform_admin");
  if (isAdmin) {
    const { data: assurance } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    redirect(assurance?.currentLevel === "aal2" ? "/admin" : "/admin/mfa");
  }
  const passwordUpdated = (await searchParams).notice === "password-updated";
  return <>
    <PublicHeader current="account" />
    <main className="vet-shell vet-page space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageIntro title="Mi cuenta"><p className="wrap-break-word">{user.email ?? "Sin correo"}</p></PageIntro>
        <form action={logoutAction}><button className="vet-button vet-button-secondary">Cerrar sesión</button></form>
      </div>
      {passwordUpdated && <Notice role="status">Tu contraseña se actualizó correctamente.</Notice>}
      <nav aria-label="Opciones de mi cuenta" className="grid gap-3 sm:grid-cols-2">
        <Link href="/account/pets" className="vet-card vet-card-action">
          <span className="vet-card-title vet-link">Mis mascotas</span>
          <span className="vet-muted mt-1 block text-sm">Registra y consulta sus fichas.</span>
        </Link>
        <Link href="/account/clinic-applications" className="vet-card vet-card-action">
          <span className="vet-card-title vet-link">Registrar mi veterinaria</span>
          <span className="vet-muted mt-1 block text-sm">Envía una solicitud o revisa su estado.</span>
        </Link>
        <Link href="/clinic" className="vet-card vet-card-action">
          <span className="vet-card-title vet-link">Espacio de clínica</span>
          <span className="vet-muted mt-1 block text-sm">Accede a tus establecimientos si tienes una membresía activa.</span>
        </Link>
      </nav>
    </main>
  </>;
}
