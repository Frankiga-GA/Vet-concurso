import Link from "next/link";
import { logoutAction } from "@/app/auth/actions";
import { requirePlatformAdminAal2 } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const { user } = await requirePlatformAdminAal2();
  return <main className="mx-auto min-h-screen max-w-5xl px-5 py-10">
    <header className="flex items-center justify-between">
      <div><p className="text-sm font-bold tracking-wide text-emerald-800">VETIA · SUPERADMIN</p><h1 className="mt-2 text-3xl font-semibold">Fundamentos y seguridad</h1></div>
      <form action={logoutAction}><button className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold">Cerrar sesión</button></form>
    </header>
    <section className="mt-8 rounded-3xl bg-white p-8 shadow-sm">
      <p className="font-medium">Sesión administrativa verificada con AAL2.</p>
      <p className="mt-2 text-sm text-slate-600">Cuenta: {user.email}</p>
      <Link className="mt-4 inline-block text-sm font-semibold text-emerald-800 underline" href="/admin/security">Administrar factores TOTP</Link>
      <div className="mt-6">
        <Link href="/admin/clinic-applications" className="inline-flex rounded-full bg-emerald-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-900">
          Consultar solicitudes de veterinarias
        </Link>
      </div>
    </section>
  </main>;
}
