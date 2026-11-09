import { Brand } from "@/components/vetia-ui";
import { RegisterFlow } from "@/features/auth/register-flow";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; tipo?: string }>;
}) {
  const { error, tipo } = await searchParams;
  const initialType =
    tipo === "agro" || tipo === "agropecuario"
      ? "agro"
      : tipo === "mascotas"
      ? "mascotas"
      : undefined;

  return (
    <main className="vet-auth">
      <div className="vet-auth-shell">
        <section className="vet-auth-grid">
          <aside className="vet-auth-aside">
            <Brand light />
            <div>
              <p className="text-sm font-bold uppercase tracking-[.14em] text-emerald-200">Tu espacio VetIA</p>
              <h2 className="mt-3 text-3xl font-bold leading-tight">
                El cuidado y sanidad animal, en un solo lugar.
              </h2>
              <ul className="mt-6 grid gap-3 text-sm text-emerald-50/85">
                <li>✓ Mascotas familiares: fichas, triaje y citas</li>
                <li>✓ VetIA Agro: predios, lotes pecuarios y SENASA</li>
                <li>✓ Asistente IA especializado 24/7</li>
                <li>✓ Directorio formal en Chincha, Pisco e Ica</li>
              </ul>
            </div>
            <p className="text-xs text-emerald-100/75">VetIA · Cuidado que conecta</p>
          </aside>
          <div className="bg-white">
            <div className="p-4 md:hidden">
              <Brand />
            </div>
            <RegisterFlow initialError={error} initialType={initialType} />
          </div>
        </section>
      </div>
    </main>
  );
}
