import Link from "next/link";
import { logoutAction } from "@/app/auth/actions";
import { requireAnyClinicMembership } from "@/lib/auth/clinic";

export const dynamic = "force-dynamic";

export default async function ClinicIndexPage() {
  const { memberships } = await requireAnyClinicMembership();
  return <main className="mx-auto min-h-screen max-w-4xl px-5 py-10">
    <header className="flex items-center justify-between"><Link href="/" className="text-xl font-bold text-emerald-800">VetIA</Link><form action={logoutAction}><button className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold">Cerrar sesión</button></form></header>
    <h1 className="mt-12 text-3xl font-semibold">Espacio de veterinaria</h1>
    {memberships.length === 0 ? <section className="mt-6 rounded-2xl bg-white p-6 text-slate-600 shadow-sm">Esta cuenta todavía no tiene una membresía activa de clínica. Una solicitud pendiente de incorporación no da acceso operativo.</section>
      : <ul className="mt-6 space-y-3">{memberships.map((membership) => <li key={membership.clinic_id} className="rounded-2xl bg-white p-5 shadow-sm">
        <p className="font-semibold">Acceso activo · {membership.role === "clinic_admin" ? "Administración" : "Personal"}</p>
        <Link className="mt-3 inline-block font-semibold text-emerald-800 underline" href={`/clinic/${membership.clinic_id}`}>Abrir establecimiento</Link>
      </li>)}</ul>}
  </main>;
}
