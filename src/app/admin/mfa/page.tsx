import { redirect } from "next/navigation";
import { AdminMfaEnrollment } from "@/features/auth/admin-mfa-enrollment";
import { hasPlatformAdminAal2, requirePlatformAdminRole } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function AdminMfaPage() {
  const { supabase } = await requirePlatformAdminRole();
  if (await hasPlatformAdminAal2(supabase)) redirect("/admin");
  const { data, error } = await supabase.auth.mfa.listFactors();
  const initialFactors = (data?.all ?? []).map(({ id, friendly_name, factor_type, status }) => ({
    id, friendly_name, factor_type, status,
  }));
  return <main className="grid min-h-screen place-items-center px-5 py-10">
    <section className="w-full max-w-lg rounded-3xl bg-white p-8 shadow-sm sm:p-10">
      <p className="text-sm font-bold tracking-wide text-emerald-800">VETIA · ADMINISTRACIÓN</p>
      <h1 className="mt-5 text-3xl font-semibold">Protege el acceso administrativo</h1>
      <AdminMfaEnrollment aal2={false} initialFactors={initialFactors} initialListFailed={Boolean(error)} />
    </section>
  </main>;
}
