import Link from "next/link";
import { notFound } from "next/navigation";
import { logoutAction } from "@/app/auth/actions";
import { requireClinicMembership } from "@/lib/auth/clinic";

export const dynamic = "force-dynamic";

export default async function ClinicHomePage({ params }: { params: Promise<{ clinicId: string }> }) {
  const { clinicId } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(clinicId)) notFound();
  const { supabase, membership } = await requireClinicMembership(clinicId);
  const { count, error } = await supabase.from("clinic_clients").select("id", { count: "exact", head: true }).eq("clinic_id", clinicId);
  return <main className="mx-auto min-h-screen max-w-4xl px-5 py-10">
    <header className="flex items-center justify-between"><Link href="/clinic" className="text-sm font-semibold text-emerald-800">← Establecimientos</Link><form action={logoutAction}><button className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold">Cerrar sesión</button></form></header>
    <section className="mt-10 rounded-3xl bg-white p-8 shadow-sm">
      <p className="text-sm font-bold uppercase tracking-widest text-emerald-800">Panel de clínica · Fase 1</p>
      <h1 className="mt-3 text-3xl font-semibold">Acceso verificado</h1>
      <p className="mt-3 text-slate-600">Rol: {membership.role === "clinic_admin" ? "administrador" : "personal"}</p>
      <p className="mt-5 rounded-xl bg-emerald-50 p-4 text-sm leading-6 text-emerald-950">La sesión solo puede consultar registros asociados a esta clínica. La gestión de clientes, mascotas, citas e incorporación se habilitará en sus fases.</p>
      {error ? <p role="status" className="mt-4 text-sm text-amber-800">No se pudo consultar el resumen en este momento.</p> : <p className="mt-4 text-sm text-slate-600">Fichas locales de clientes: {count ?? 0}</p>}
    </section>
  </main>;
}
