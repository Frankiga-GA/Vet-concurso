import Link from "next/link";

export default async function AdminAccessPage({ searchParams }: { searchParams: Promise<{ reason?: string }> }) {
  const { reason } = await searchParams;
  return <main className="mx-auto max-w-xl px-5 py-12">
    <section className="rounded-3xl bg-white p-6 shadow-sm sm:p-8">
      <h1 className="text-2xl font-semibold">Acceso al panel</h1>
      <p role="alert" className="mt-3 text-sm text-slate-700">
        {reason === "unavailable"
          ? "No pudimos comprobar tus permisos administrativos. Vuelve a intentar en unos minutos."
          : "Tu cuenta no tiene permisos de superadministración."}
      </p>
      <Link href="/account" className="mt-5 inline-block text-sm font-semibold text-emerald-800 underline">Volver a mi cuenta</Link>
    </section>
  </main>;
}
