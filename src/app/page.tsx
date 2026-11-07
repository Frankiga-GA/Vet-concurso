import Link from "next/link";
import { getSupabaseConfigStatus } from "@/lib/config";

export default function HomePage() {
  const configured = getSupabaseConfigStatus();

  return (
    <main className="min-h-screen px-5 py-8 sm:px-10">
      <header className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
        <Link className="text-2xl font-bold tracking-tight text-[var(--green)]" href="/">VetIA</Link>
        <nav className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium">
          <Link href="/veterinarias">Veterinarias</Link>
          <Link href="/auth/login">Ingresar</Link>
          <Link href="/auth/register">Crear cuenta</Link>
        </nav>
      </header>

      <section className="mx-auto grid max-w-6xl gap-12 py-20 md:grid-cols-[1.2fr_0.8fr] md:items-center md:py-28">
        <div>
          <p className="mb-5 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--green)]">Orientación que conecta</p>
          <h1 className="max-w-2xl text-5xl font-semibold leading-[1.06] tracking-tight sm:text-6xl">Cuidar mejor empieza con saber a dónde acudir.</h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-[var(--muted)]">VetIA reúne orientación inicial y veterinarias asociadas de Chincha, Pisco e Ica.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link className="rounded-full border border-emerald-900/20 bg-white px-6 py-3 font-semibold" href="/veterinarias">Buscar veterinaria</Link>
            <Link className="rounded-full bg-[var(--green)] px-6 py-3 font-semibold text-white" href="/auth/register">Crear cuenta</Link>
            <Link className="rounded-full border border-emerald-900/20 bg-white px-6 py-3 font-semibold" href="/auth/login">Iniciar sesión</Link>
          </div>
          <p className="mt-5 max-w-xl text-sm leading-6 text-[var(--muted)]">VetIA está preparando su piloto controlado. La orientación no reemplaza la evaluación de un profesional veterinario.</p>
        </div>

        <aside className="rounded-[2rem] bg-[var(--mint)] p-8 sm:p-10">
          <div className="mb-8 inline-flex rounded-full bg-white px-3 py-1 text-xs font-bold text-[var(--green)]">PILOTO VETIA</div>
          <h2 className="text-2xl font-semibold">Una red local, con cuidado en el centro.</h2>
          <ul className="mt-6 space-y-4 text-[var(--muted)]">
            <li>• Orientación inicial para saber qué hacer a continuación.</li>
            <li>• Veterinarias asociadas revisadas antes de publicarse.</li>
            <li>• Coordinación directa con el establecimiento elegido.</li>
          </ul>
          {!configured && <p className="mt-8 rounded-xl bg-white/75 p-4 text-sm text-[var(--muted)]">El entorno de autenticación todavía no está configurado. La interfaz está preparada; las cuentas estarán disponibles al conectar Supabase.</p>}
        </aside>
      </section>

      <footer className="mx-auto max-w-6xl border-t border-emerald-950/10 py-6 text-sm text-[var(--muted)]">Orientación responsable. Atención veterinaria real cuando hace falta.</footer>
    </main>
  );
}
