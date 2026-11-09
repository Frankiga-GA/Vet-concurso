import { redirect } from "next/navigation";
import Link from "next/link";
import { logoutAction } from "@/app/auth/actions";
import { requireUser } from "@/lib/auth/session";
import { FeatureCard, Notice, OwnerNav, PageIntro, PublicHeader } from "@/components/vetia-ui";
import { AgroModeSwitcher } from "@/features/agro/agro-components";

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

  const { data: profileData } = await supabase.rpc("vetia_my_profile").maybeSingle();
  const profile = profileData as { account_type?: string | null } | null;
  const isAgro = profile?.account_type === "agro" || user.user_metadata?.account_type === "agro";

  return (
    <>
      <PublicHeader current="account" />
      <main className="vet-shell vet-page space-y-7">
        <OwnerNav current="overview" />
        <div className="flex flex-wrap items-start justify-between gap-4">
          <PageIntro title="Hola, bienvenido a VetIA" label="Mi cuenta">
            <p className="wrap-break-word">{user.email ?? "Sin correo"}</p>
          </PageIntro>
          <form action={logoutAction}>
            <button className="vet-button vet-button-secondary">Cerrar sesión</button>
          </form>
        </div>
        {passwordUpdated && <Notice role="status">Tu contraseña se actualizó correctamente.</Notice>}

        {/* Acceso diferenciado Mascotas y Agro según preferencia */}
        <AgroModeSwitcher current={isAgro ? "agro" : "pets"} />

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Card Mascotas */}
          <section className="vet-card vet-card-soft flex flex-col justify-between p-5 border-slate-200">
            <div>
              <span className="vet-eyebrow">Animales de Compañía</span>
              <h2 className="vet-card-title mt-1">Mascotas Familiares</h2>
              <p className="vet-muted mt-1 text-sm">
                Fichas clínicas de perros y gatos para consultas y veterinarias.
              </p>
            </div>
            <div className="mt-4">
              <Link href="/account/pets" className="vet-button vet-button-primary !text-xs py-2 px-4">
                🐾 Gestionar mascotas
              </Link>
            </div>
          </section>

          {/* Card Agro */}
          <section className="vet-card bg-emerald-50/60 flex flex-col justify-between p-5 border border-emerald-200">
            <div>
              <span className="vet-eyebrow text-emerald-800">Animales de Producción</span>
              <h2 className="vet-card-title mt-1 text-emerald-950">VetIA Agropecuario</h2>
              <p className="vet-muted mt-1 text-sm text-slate-600">
                Predios, lotes sanitarios y censo de bovinos, porcinos, ovinos, caprinos y aves.
              </p>
            </div>
            <div className="mt-4">
              <Link href="/account/agro" className="vet-button vet-button-primary !text-xs py-2 px-4 shadow-sm">
                🌾 Abrir VetIA Agro
              </Link>
            </div>
          </section>
        </div>

        <section aria-labelledby="account-actions">
          <h2 id="account-actions" className="vet-section-title">Accesos rápidos</h2>
          <nav aria-label="Opciones de mi cuenta" className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <FeatureCard icon="◉" title="Mi perfil" href="/account/profile">
              Actualiza tus datos personales y ciudad.
            </FeatureCard>
            <FeatureCard icon="♥" title="Mis mascotas" href="/account/pets">
              Registra y consulta fichas de compañía.
            </FeatureCard>
            <FeatureCard icon="🌾" title="VetIA Agro" href="/account/agro">
              Predios, lotes y censo pecuario.
            </FeatureCard>
            <FeatureCard icon="+" title="Incorporar veterinaria" href="/account/clinic-applications">
              Solicitud de acreditación formal.
            </FeatureCard>
            {hasOperationalClinic && (
              <FeatureCard icon="▦" title="Panel de clínica" href="/clinic">
                Establecimientos con membresía activa.
              </FeatureCard>
            )}
          </nav>
        </section>

        <section className="grid gap-4 sm:grid-cols-3">
          <Link href="/veterinarias" className="vet-card vet-card-action">
            <span className="vet-kicker">Directorio público</span>
            <h2 className="vet-card-title mt-3">Buscar atención veterinaria</h2>
            <p className="vet-muted mt-1 text-sm">Explora clínicas verificadas por ciudad y servicio.</p>
          </Link>
          <Link href="/asistente" className="vet-card vet-card-action">
            <span className="vet-kicker">Orientación IA</span>
            <h2 className="vet-card-title mt-3">Asistente de Mascotas</h2>
            <p className="vet-muted mt-1 text-sm">Triaje para perros y gatos ante síntomas o dudas.</p>
          </Link>
          <Link href="/asistente?mode=agro" className="vet-card vet-card-action bg-emerald-50/40 border-emerald-200">
            <span className="vet-kicker bg-emerald-100 text-emerald-800">IA Agropecuaria</span>
            <h2 className="vet-card-title mt-3 text-emerald-950">Asistente VetIA Agro</h2>
            <p className="vet-muted mt-1 text-sm text-emerald-900">Orientación de sanidad animal, bioseguridad y alertas SENASA.</p>
          </Link>
        </section>
      </main>
    </>
  );
}
