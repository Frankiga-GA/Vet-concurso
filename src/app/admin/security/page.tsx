import { redirect } from "next/navigation";
import { AdminMfaEnrollment } from "@/features/auth/admin-mfa-enrollment";
import { requirePlatformAdmin } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function AdminSecurityPage() {
  const { supabase, aal2 } = await requirePlatformAdmin();
  if (!aal2) redirect("/admin/mfa");
  const { data: factorData } = await supabase.auth.mfa.listFactors();
  const initialFactors = (factorData?.all ?? []).map((factor) => ({ id: factor.id, friendly_name: factor.friendly_name, factor_type: factor.factor_type, status: factor.status }));
  return <main className="mx-auto min-h-screen max-w-3xl px-5 py-10">
    <h1 className="text-3xl font-semibold">Seguridad administrativa</h1>
    <AdminMfaEnrollment aal2={aal2} initialFactors={initialFactors} />
  </main>;
}
