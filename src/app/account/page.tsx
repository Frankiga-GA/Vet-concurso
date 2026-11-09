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

  const { data: profileData } = await supabase.rpc("vetia_my_profile").maybeSingle();
  const profile = profileData as { account_type?: string | null } | null;
  const modality: "mascotas" | "agro" =
    (profile?.account_type === "agro" || user.user_metadata?.account_type === "agro") ? "agro" : "mascotas";
  const isAgro = modality === "agro";

  return (
    <>
      <PublicHeader current="account" />
      <main className="vet-shell vet-page space-y-7">
        <OwnerNav current="overview" modality={modality} />

        <div className="flex flex-wrap items-start justify-between gap-4">
          <PageIntro
            title={isAgro ? "Panel VetIA Agropecuario" : "Panel de Mascotas Familiares"}
            label={`Mi cuenta · ${isAgro ? "🌾 Modalidad Agropecuaria" : "🐾 Modalidad Mascotas"}`}
          >
            <p className="wrap-break-word">
              {user.email ?? "Sin correo"} ·{" "}
              <Link href="/account/profile" className="text-[var(--green)] underline font-medium hover:text-[var(--green-dark)]">
                Cambiar modalidad en Mi perfil
              </Link>
            </p>
          </PageIntro>
          <form action={logoutAction}>
            <button className="vet-button vet-button-secondary">Cerrar sesión</button>
          </form>
        </div>

        {passwordUpdated && <Notice role="status">Tu contraseña se actualizó correctamente.</Notice>}

        {/* ======================================================== */}
        {/* DASHBOARD EXCLUSIVO SEGÚN LA MODALIDAD ELEGIDA           */}
        {/* ======================================================== */}
        {isAgro ? (
          /* ======================================================== */
          /* 1. DASHBOARD EXCLUSIVO AGROPECUARIO                      */
          /* ======================================================== */
          <div className="space-y-7">
            {/* Tarjeta destacada Agro */}
            <section className="vet-card bg-emerald-50/70 border border-emerald-300 p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xs">
              <div className="space-y-2 max-w-xl">
                <span className="vet-badge bg-emerald-100 text-emerald-900 border-emerald-300 font-bold">
                  🌾 Gestión Ganadera y Pecuaria
                </span>
                <h2 className="text-xl sm:text-2xl font-extrabold text-emerald-950">
                  Explotaciones, Lotes y Trazabilidad Sanitaria
                </h2>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                  Lleva el control de predios rurales, registra animales y lotes de bovinos, porcinos, ovinos, caprinos o aves, y monitorea su sanidad y bioseguridad.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                <Link href="/account/agro" className="vet-button vet-button-primary !w-full sm:!w-auto py-2.5 px-5">
                  🌾 Abrir panel VetIA Agro →
                </Link>
              </div>
            </section>

            {/* Accesos rápidos exclusivos Agro */}
            <section aria-labelledby="account-actions-agro">
              <h2 id="account-actions-agro" className="vet-section-title">
                Funciones agropecuarias
              </h2>
              <nav aria-label="Opciones agropecuarias" className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <FeatureCard icon="🌾" title="Gestión de predios y lotes" href="/account/agro">
                  Administra explotaciones pecuarias, censo animal y alertas de salud.
                </FeatureCard>
                <FeatureCard icon="◉" title="Mi perfil" href="/account/profile">
                  Actualiza tus datos personales y ciudad, o cambia a la modalidad Mascotas.
                </FeatureCard>
                <FeatureCard icon="+" title="Solicitar incorporación de mi clínica" href="/account/clinic-applications">
                  Acreditación formal para veterinarios de campo y servicios pecuarios.
                </FeatureCard>
                {hasOperationalClinic && (
                  <FeatureCard icon="▦" title="Panel de clínica" href="/clinic">
                    Establecimientos veterinarios con membresía activa.
                  </FeatureCard>
                )}
              </nav>
            </section>

            {/* Herramientas especializadas Agro */}
            <section className="grid gap-4 sm:grid-cols-2">
              <Link href="/asistente?mode=agro" className="vet-card vet-card-action bg-emerald-50/40 border-emerald-300 p-5">
                <span className="vet-kicker bg-emerald-100 text-emerald-800">IA Veterinaria Agro</span>
                <h3 className="vet-card-title mt-2 text-emerald-950">Asistente VetIA Agro</h3>
                <p className="vet-muted mt-1 text-sm text-slate-600">
                  Orientación técnica de sanidad animal, bioseguridad en predios y alertas sanitarias SENASA.
                </p>
                <span className="vet-button vet-button-ghost !text-xs !p-0 mt-3 text-emerald-800 font-bold block">
                  Consultar al asistente agropecuario →
                </span>
              </Link>
              <Link href="/veterinarias" className="vet-card vet-card-action p-5">
                <span className="vet-kicker">Directorio regional</span>
                <h3 className="vet-card-title mt-2">Buscar atención veterinaria</h3>
                <p className="vet-muted mt-1 text-sm text-slate-600">
                  Encuentra profesionales colegiados y clínicas acreditadas en Chincha, Pisco e Ica.
                </p>
                <span className="vet-button vet-button-ghost !text-xs !p-0 mt-3 text-[var(--green)] font-bold block">
                  Explorar directorio veterinario →
                </span>
              </Link>
            </section>
          </div>
        ) : (
          /* ======================================================== */
          /* 2. DASHBOARD EXCLUSIVO MASCOTAS                          */
          /* ======================================================== */
          <div className="space-y-7">
            {/* Tarjeta destacada Mascotas */}
            <section className="vet-card border-slate-200 bg-white p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xs">
              <div className="space-y-2 max-w-xl">
                <span className="vet-badge bg-emerald-100 text-[var(--green-dark)] font-bold">
                  🐾 Animales de Compañía
                </span>
                <h2 className="text-xl sm:text-2xl font-extrabold text-[var(--ink)]">
                  Fichas Clínicas de tus Mascotas
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Consulta y mantén al día los datos clínicos, vacunas, historial y cuidados de tus perros y gatos para consultas y emergencias.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                <Link href="/account/pets" className="vet-button vet-button-primary !w-full sm:!w-auto py-2.5 px-5">
                  🐾 Gestionar mis mascotas →
                </Link>
              </div>
            </section>

            {/* Accesos rápidos exclusivos Mascotas */}
            <section aria-labelledby="account-actions-pets">
              <h2 id="account-actions-pets" className="vet-section-title">
                Funciones de tu cuenta
              </h2>
              <nav aria-label="Opciones de mascotas" className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <FeatureCard icon="♥" title="Mis mascotas" href="/account/pets">
                  Registra nuevas mascotas y mantén sus fichas clínicas y vacunas al día.
                </FeatureCard>
                <FeatureCard icon="◉" title="Mi perfil" href="/account/profile">
                  Actualiza tus datos de contacto y ciudad, o cambia a la modalidad Agropecuaria.
                </FeatureCard>
                <FeatureCard icon="+" title="Solicitar incorporación de mi clínica" href="/account/clinic-applications">
                  Solicitud formal de acreditación para tu consultorio o clínica veterinaria.
                </FeatureCard>
                {hasOperationalClinic && (
                  <FeatureCard icon="▦" title="Panel de clínica" href="/clinic">
                    Establecimientos veterinarios con membresía activa.
                  </FeatureCard>
                )}
              </nav>
            </section>

            {/* Herramientas especializadas Mascotas */}
            <section className="grid gap-4 sm:grid-cols-2">
              <Link href="/asistente" className="vet-card vet-card-action p-5">
                <span className="vet-kicker">Triaje IA</span>
                <h3 className="vet-card-title mt-2">Asistente IA de Mascotas</h3>
                <p className="vet-muted mt-1 text-sm text-slate-600">
                  Describe los síntomas de tu perro o gato, recibe orientación preventiva inmediata y detecta signos de alarma.
                </p>
                <span className="vet-button vet-button-ghost !text-xs !p-0 mt-3 text-[var(--green)] font-bold block">
                  Conversar con el asistente IA →
                </span>
              </Link>
              <Link href="/veterinarias" className="vet-card vet-card-action p-5">
                <span className="vet-kicker">Directorio público</span>
                <h3 className="vet-card-title mt-2">Buscar veterinarias verificadas</h3>
                <p className="vet-muted mt-1 text-sm text-slate-600">
                  Explora clínicas veterinarias colegiadas con RUC y colegiatura CMVP en Chincha, Pisco e Ica.
                </p>
                <span className="vet-button vet-button-ghost !text-xs !p-0 mt-3 text-[var(--green)] font-bold block">
                  Ver directorio de clínicas →
                </span>
              </Link>
            </section>
          </div>
        )}
      </main>
    </>
  );
}
