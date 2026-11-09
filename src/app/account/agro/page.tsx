import Link from "next/link";
import { Suspense } from "react";
import { logoutAction } from "@/app/auth/actions";
import { requireUser } from "@/lib/auth/session";
import { Notice, OwnerNav, PageIntro, PublicHeader } from "@/components/vetia-ui";
import {
  agroFarmListSchema,
  agroHerdListSchema,
  type AgroFarm,
  type AgroHerd,
} from "@/features/agro/contract";
import {
  FarmForm,
  HerdForm,
  DeleteHerdButton,
  AgroModeSwitcher,
  SPECIES_LABELS,
  HOLDING_TYPE_LABELS,
  HEALTH_STATUS_BADGES,
} from "@/features/agro/agro-components";

export const dynamic = "force-dynamic";

async function AgroDashboardData({
  supabase,
}: {
  supabase: Awaited<ReturnType<typeof requireUser>>["supabase"];
}) {
  const [farmsRes, herdsRes] = await Promise.all([
    supabase.rpc("vetia_list_my_agro_farms"),
    supabase.rpc("vetia_list_my_agro_herds"),
  ]);

  const parsedFarms = agroFarmListSchema.safeParse(farmsRes.data);
  const parsedHerds = agroHerdListSchema.safeParse(herdsRes.data);

  const farms: AgroFarm[] = parsedFarms.success ? parsedFarms.data : [];
  const herds: AgroHerd[] = parsedHerds.success ? parsedHerds.data : [];

  const totalHeadCount = herds.reduce((sum, h) => sum + h.head_count, 0);

  const speciesSummary = herds.reduce<Record<string, number>>((acc, h) => {
    acc[h.species] = (acc[h.species] || 0) + h.head_count;
    return acc;
  }, {});

  return (
    <div className="space-y-8">
      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="vet-card p-4">
          <p className="text-xs font-bold text-[var(--muted)]">Explotaciones</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-[var(--ink)] mt-1">
            {farms.length}
          </p>
          <p className="text-[11px] text-[var(--green-dark)] font-semibold mt-0.5">Predios guardados</p>
        </div>

        <div className="vet-card p-4">
          <p className="text-xs font-bold text-[var(--muted)]">Población pecuaria</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-[var(--green)] mt-1">
            {totalHeadCount}
          </p>
          <p className="text-[11px] text-[var(--muted)] mt-0.5">Cabezas y aves totales</p>
        </div>

        <div className="vet-card p-4">
          <p className="text-xs font-bold text-[var(--muted)]">Lotes / Fichas</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-[var(--ink)] mt-1">
            {herds.length}
          </p>
          <p className="text-[11px] text-[var(--muted)] mt-0.5">Registros sanitarios</p>
        </div>

        <div className="vet-card p-4">
          <p className="text-xs font-bold text-[var(--muted)]">Asistente IA Agro</p>
          <Link
            href="/asistente?mode=agro"
            className="inline-flex items-center gap-1.5 mt-2 rounded-lg bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-xs font-extrabold text-[var(--green-dark)] hover:bg-emerald-100 transition"
          >
            <span>🌾</span>
            <span>Consultar triaje →</span>
          </Link>
          <p className="text-[10px] text-[var(--muted)] mt-1">Detección zoosanitaria</p>
        </div>
      </div>

      {/* Summary by species pills */}
      {herds.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl bg-white border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold text-[var(--ink-soft)] mr-1">Censo por especie:</span>
          {Object.entries(speciesSummary).map(([species, count]) => (
            <span
              key={species}
              className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-800"
            >
              <span>{SPECIES_LABELS[species]?.icon || "🐾"}</span>
              <span className="capitalize">{species}:</span>
              <span className="font-bold text-[var(--green)]">{count}</span>
            </span>
          ))}
        </div>
      )}

      {/* Herds / Animals List */}
      <section aria-labelledby="herds-heading" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="vet-eyebrow">Control Sanitario Pecuario</p>
            <h2 id="herds-heading" className="vet-section-title mt-0.5">
              Animales y lotes registrados
            </h2>
          </div>
          <a href="#new-herd" className="vet-button vet-button-primary !text-xs py-2 px-3.5">
            + Añadir lote o animal
          </a>
        </div>

        {herds.length === 0 ? (
          <div className="vet-card p-8 text-center text-xs text-[var(--muted)] space-y-2">
            <span className="text-3xl block">🌾</span>
            <p className="text-sm font-bold text-[var(--ink)]">Aún no tienes animales o lotes registrados</p>
            <p className="max-w-md mx-auto">
              Registra tu primer predio y añade las fichas sanitarias de tus bovinos, porcinos, ovinos, caprinos o aves.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {herds.map((herd) => {
              const statusInfo = HEALTH_STATUS_BADGES[herd.health_status] || {
                label: herd.health_status,
                className: "bg-slate-100 text-slate-800 border-slate-200",
              };
              const spInfo = SPECIES_LABELS[herd.species] || { label: herd.species, icon: "🐾" };

              return (
                <div
                  key={herd.id}
                  className="vet-card flex flex-col justify-between p-4 border-slate-200 shadow-xs hover:border-emerald-300 transition"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-xl border border-emerald-100">
                          {spInfo.icon}
                        </span>
                        <div>
                          <h3 className="text-sm font-extrabold text-[var(--ink)] leading-snug">
                            {herd.identifier}
                          </h3>
                          <p className="text-[11px] text-[var(--muted)] font-medium">
                            {herd.farm_name} • {herd.location_in_farm || "Predio principal"}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${statusInfo.className}`}
                      >
                        {statusInfo.label}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50/70 p-2.5 rounded-lg border border-slate-100">
                      <div>
                        <span className="text-[10px] text-[var(--muted)] block uppercase font-bold">
                          Especie y Tipo
                        </span>
                        <span className="font-semibold text-slate-800">
                          {spInfo.label} ({herd.record_type})
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[var(--muted)] block uppercase font-bold">
                          Cantidad
                        </span>
                        <span className="font-extrabold text-[var(--green-dark)]">
                          {herd.head_count} {herd.head_count === 1 ? "cabeza" : "cabezas/aves"}
                        </span>
                      </div>
                      {herd.breed && (
                        <div>
                          <span className="text-[10px] text-[var(--muted)] block uppercase font-bold">Raza</span>
                          <span className="text-slate-800">{herd.breed}</span>
                        </div>
                      )}
                      {herd.production_purpose && (
                        <div>
                          <span className="text-[10px] text-[var(--muted)] block uppercase font-bold">Propósito</span>
                          <span className="text-slate-800 capitalize">{herd.production_purpose}</span>
                        </div>
                      )}
                    </div>

                    {/* Ficha Sanitaria */}
                    <div className="space-y-1 text-xs border-t border-slate-100 pt-2">
                      {herd.vaccines_applied && (
                        <p className="text-[11px] text-slate-700">
                          <strong className="text-emerald-800">Vacunación:</strong> {herd.vaccines_applied}
                        </p>
                      )}
                      {herd.deworming_applied && (
                        <p className="text-[11px] text-slate-700">
                          <strong className="text-emerald-800">Desparasitación:</strong> {herd.deworming_applied}
                        </p>
                      )}
                      {herd.observations && (
                        <p className="text-[11px] text-slate-600 italic">
                          "{herd.observations}"
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 pt-2.5 mt-3">
                    <Link
                      href={`/asistente?mode=agro&species=${herd.species}`}
                      className="text-[11px] font-bold text-[var(--green)] hover:underline flex items-center gap-1"
                    >
                      <span>🌾 Triaje IA</span>
                      <span>→</span>
                    </Link>
                    <DeleteHerdButton herdId={herd.id} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Farms List */}
      <section aria-labelledby="farms-heading" className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="vet-eyebrow">Predios y Fundos</p>
            <h2 id="farms-heading" className="vet-section-title mt-0.5">
              Explotaciones registradas
            </h2>
          </div>
          <a href="#new-farm" className="text-xs font-bold text-[var(--green)] hover:underline">
            + Nuevo predio
          </a>
        </div>

        {farms.length === 0 ? (
          <div className="vet-card p-6 text-center text-xs text-[var(--muted)]">
            No tienes explotaciones guardadas. Completa el formulario de abajo para registrar tu primera granja o establo.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {farms.map((f) => (
              <div key={f.id} className="vet-card p-4 border-slate-200/90 shadow-xs">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-bold text-[var(--ink)]">{f.name}</h3>
                  <span className="rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5">
                    {f.province}
                  </span>
                </div>
                <p className="text-xs text-[var(--muted)] mt-1">
                  {HOLDING_TYPE_LABELS[f.holding_type] || f.holding_type}
                </p>
                <div className="mt-2 text-xs text-slate-600 space-y-0.5">
                  <p>📍 {f.district}, {f.province} ({f.department})</p>
                  {f.senasa_code && (
                    <p className="font-mono text-[11px] text-emerald-900">
                      SENASA: {f.senasa_code}
                    </p>
                  )}
                  {f.address_reference && (
                    <p className="text-[11px] text-[var(--muted)]">{f.address_reference}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Management Forms */}
      <div className="grid items-start gap-6 lg:grid-cols-2 pt-4">
        {/* Farm Form */}
        <section id="new-farm" aria-labelledby="new-farm-heading" className="vet-card space-y-3">
          <div className="border-b border-slate-100 pb-2.5">
            <span className="vet-kicker">Paso 1</span>
            <h2 id="new-farm-heading" className="vet-card-title mt-2">
              Registrar Explotación Agropecuaria
            </h2>
            <p className="vet-muted text-xs mt-1">
              Guarda los datos de tu predio, granja o establo en la Región Ica.
            </p>
          </div>
          <FarmForm />
        </section>

        {/* Herd Form */}
        <section id="new-herd" aria-labelledby="new-herd-heading" className="vet-card space-y-3">
          <div className="border-b border-slate-100 pb-2.5">
            <span className="vet-kicker">Paso 2</span>
            <h2 id="new-herd-heading" className="vet-card-title mt-2">
              Registrar Animal o Lote Productivo
            </h2>
            <p className="vet-muted text-xs mt-1">
              Ficha zootécnica para bovinos, porcinos, ovinos, caprinos y aves.
            </p>
          </div>
          <HerdForm farms={farms} />
        </section>
      </div>
    </div>
  );
}

export default async function AgroPage() {
  const { supabase } = await requireUser();

  return (
    <>
      <PublicHeader current="account" />
      <main className="vet-shell vet-page space-y-6">
        <OwnerNav current="agro" />

        <div className="flex flex-wrap items-start justify-between gap-4">
          <PageIntro
            title="VetIA Agro"
            label="Gestión Ganadera y Pecuaria"
          >
            <p>
              Administra tus predios, registra animales individuales o lotes de producción (bovinos, porcinos, ovinos, caprinos y aves) y mantén su trazabilidad sanitaria.
            </p>
          </PageIntro>
          <form action={logoutAction}>
            <button className="vet-button vet-button-secondary">Cerrar sesión</button>
          </form>
        </div>

        {/* Differentiated Access Toggle */}
        <AgroModeSwitcher current="agro" />

        <Suspense fallback={<Notice role="status">Cargando datos pecuarios…</Notice>}>
          <AgroDashboardData supabase={supabase} />
        </Suspense>
      </main>
    </>
  );
}
