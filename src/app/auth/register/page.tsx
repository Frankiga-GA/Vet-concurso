import Link from "next/link";
import { RegisterFlow } from "@/features/auth/register-flow";
import { ScanEye, Smartphone, ShieldCheck, ThermometerSun, Truck } from "lucide-react";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; tipo?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="vet-auth">
      <div className="vet-auth-shell">
        <section className="vet-auth-grid">
          <aside className="vet-auth-aside">
            {/* Brand */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center text-white shadow-sm">
                <ScanEye className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-black tracking-tight text-white">
                  IAVET<span className="text-emerald-300 ml-1 font-extrabold">AGRO</span>
                </span>
                <span className="text-[10px] font-mono text-emerald-200 uppercase tracking-wider font-semibold">
                  B2B Agritech Pecuario
                </span>
              </div>
            </div>

            <div>
              <p className="text-xs font-mono font-bold uppercase tracking-[.14em] text-emerald-200">
                Plataforma Pecuaria B2B
              </p>
              <h2 className="mt-3 text-2xl sm:text-3xl font-black leading-tight text-white">
                Inteligencia Artificial y Visión Móvil para Galpones.
              </h2>
              <ul className="mt-6 grid gap-3 text-sm text-emerald-50/90">
                <li className="flex items-start gap-2">
                  <Smartphone className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" />
                  <span>Censo y conteo con la cámara de tu celular (sin cámaras fijas)</span>
                </li>
                <li className="flex items-start gap-2">
                  <ThermometerSun className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" />
                  <span>Detección temprana de anomalías y estrés térmico en Ica</span>
                </li>
                <li className="flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" />
                  <span>Control de lotes pecuarios y trazabilidad con SENASA</span>
                </li>
                <li className="flex items-start gap-2">
                  <Truck className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" />
                  <span>Directorio B2B de proveedores e insumos verificados</span>
                </li>
              </ul>
            </div>

            <p className="text-xs text-emerald-100/75 font-medium">
              IAVET Agro · Tecnología para los productores de Ica y el Perú
            </p>
          </aside>

          <div className="bg-white">
            <div className="p-4 md:hidden flex items-center gap-2.5 border-b border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                <ScanEye className="w-4 h-4" />
              </div>
              <span className="text-lg font-black tracking-tight text-slate-900">
                IAVET<span className="text-emerald-600 ml-1">AGRO</span>
              </span>
            </div>
            <RegisterFlow initialError={error} />
          </div>
        </section>
      </div>
    </main>
  );
}
