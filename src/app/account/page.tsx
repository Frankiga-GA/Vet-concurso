import { redirect } from "next/navigation";
import Link from "next/link";
import { logoutAction } from "@/app/auth/actions";
import { requireUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const { user, supabase } = await requireUser();
  const { data: isAdmin } = await supabase.rpc("vetia_is_platform_admin");
  if (isAdmin) {
    const { data: assurance } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    redirect(assurance?.currentLevel === "aal2" ? "/admin" : "/admin/mfa");
  }
  return <main className="mx-auto min-h-screen max-w-4xl px-5 py-12">
    <div className="flex items-center justify-between"><Link href="/" className="text-xl font-bold text-emerald-800">VetIA</Link>
      <form action={logoutAction}><button className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold">Cerrar sesión</button></form>
    </div>
    <section className="mt-12 rounded-3xl bg-white p-8 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-widest text-emerald-800">Cuenta del propietario</p>
      <h1 className="mt-3 text-3xl font-semibold">Sesión iniciada</h1>
      <p className="mt-3 text-slate-600">Correo: {user.email ?? "sin correo"}</p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/account/pets" className="rounded-full bg-emerald-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-900">
          Mis mascotas
        </Link>
        <Link href="/account/clinic-applications" className="rounded-full border border-emerald-800 px-5 py-2.5 text-sm font-semibold text-emerald-800 hover:bg-emerald-50">
          Registrar mi veterinaria
        </Link>
      </div>
    </section>
  </main>;
}
