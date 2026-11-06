import { redirect } from "next/navigation";
import Link from "next/link";
import { logoutAction } from "@/app/auth/actions";
import { requirePlatformAdmin } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const { aal2, user } = await requirePlatformAdmin();
  if (!aal2) redirect("/admin/mfa");
  return <main className="mx-auto min-h-screen max-w-5xl px-5 py-10">
    <header className="flex items-center justify-between">
      <div><p className="text-sm font-bold tracking-wide text-emerald-800">VETIA · SUPERADMIN</p><h1 className="mt-2 text-3xl font-semibold">Fundamentos y seguridad</h1></div>
      <form action={logoutAction}><button className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold">Cerrar sesión</button></form>
    </header>
    <section className="mt-8 rounded-3xl bg-white p-8 shadow-sm">
      <p className="font-medium">Sesión administrativa verificada con AAL2.</p>
      <p className="mt-2 text-sm text-slate-600">Cuenta: {user.email}</p>
      <Link className="mt-4 inline-block text-sm font-semibold text-emerald-800 underline" href="/admin/security">Administrar factores TOTP</Link>
      <p className="mt-6 rounded-xl bg-emerald-50 p-4 text-sm leading-6 text-emerald-950">Esta entrega cubre la Fase 1: autenticación, identidad, membresías y controles base. La revisión de clínicas, directorio y operaciones comerciales se implementarán en las siguientes fases.</p>
    </section>
  </main>;
}
