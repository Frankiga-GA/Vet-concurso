import { redirect } from "next/navigation";
import Link from "next/link";
import { logoutAction } from "@/app/auth/actions";
import { requireUser } from "@/lib/auth/session";
import { FeatureCard, Notice, OwnerNav, PageIntro, PublicHeader } from "@/components/vetia-ui";

export const dynamic = "force-dynamic";

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ notice?: string }> }) {
  const { user, supabase } = await requireUser();
  const { data: isAdmin } = await supabase.rpc("vetia_is_platform_admin");
  if (isAdmin) {
    const { data: assurance } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    redirect(assurance?.currentLevel === "aal2" ? "/admin" : "/admin/mfa");
  }
  const { data: membershipRows, error: membershipError } = await supabase
    .rpc("vetia_my_operational_clinics", { p_clinic_id: null })
    .limit(1);
  const hasOperationalClinic = !membershipError && Array.isArray(membershipRows) && membershipRows.length > 0;
  const passwordUpdated = (await searchParams).notice === "password-updated";
  return <>
    <PublicHeader current="account" />
    <main className="vet-shell vet-page space-y-7">
      <OwnerNav current="overview" />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageIntro title="Hola, bienvenido a VetIA" label="Mi cuenta"><p className="wrap-break-word">{user.email ?? "Sin correo"}</p></PageIntro>
        <form action={logoutAction}><button className="vet-button vet-button-secondary">Cerrar sesión</button></form>
      </div>
      {passwordUpdated && <Notice role="status">Tu contraseña se actualizó correctamente.</Notice>}
      <section className="vet-card vet-card-soft flex flex-wrap items-center justify-between gap-4">
        <div><p className="vet-eyebrow">Empieza por aquí</p><h2 className="vet-card-title mt-1">Mantén al día la información de tus mascotas</h2><p className="vet-muted mt-1 text-sm">Así tendrás sus datos básicos listos cuando necesites atención.</p></div>
        <Link href="/account/pets" className="vet-button vet-button-primary">Ver mis mascotas</Link>
      </section>
      <section aria-labelledby="account-actions">
        <h2 id="account-actions" className="vet-section-title">Accesos rápidos</h2>
        <nav aria-label="Opciones de mi cuenta" className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <FeatureCard icon="◉" title="Mi perfil" href="/account/profile">Actualiza tus datos personales y ciudad.</FeatureCard>
          <FeatureCard icon="♥" title="Mis mascotas" href="/account/pets">Registra, consulta y actualiza sus fichas.</FeatureCard>
          <FeatureCard icon="+" title="Incorporar veterinaria" href="/account/clinic-applications">Envía una solicitud o consulta su estado.</FeatureCard>
          {hasOperationalClinic && <FeatureCard icon="▦" title="Panel de clínica" href="/clinic">Accede a establecimientos con membresía activa.</FeatureCard>}
        </nav>
      </section>
      <section className="grid gap-4 sm:grid-cols-2">
        <Link href="/veterinarias" className="vet-card vet-card-action"><span className="vet-kicker">Directorio público</span><h2 className="vet-card-title mt-3">Buscar atención veterinaria</h2><p className="vet-muted mt-1 text-sm">Explora clínicas verificadas por ciudad y servicio.</p></Link>
        <Link href="/asistente" className="vet-card vet-card-action"><span className="vet-kicker">Orientación inicial</span><h2 className="vet-card-title mt-3">Consultar al asistente VetIA</h2><p className="vet-muted mt-1 text-sm">Conoce señales de alarma y cuándo acudir a un profesional.</p></Link>
      </section>
    </main>
  </>;
}
