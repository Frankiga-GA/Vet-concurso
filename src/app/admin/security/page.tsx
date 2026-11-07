import { AdminMfaEnrollment } from "@/features/auth/admin-mfa-enrollment";
import { requirePlatformAdminAal2 } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function AdminSecurityPage() {
  const { supabase } = await requirePlatformAdminAal2();
  const { data: factorData } = await supabase.auth.mfa.listFactors();
  const initialFactors = (factorData?.all ?? []).map((factor) => ({ id: factor.id, friendly_name: factor.friendly_name, factor_type: factor.factor_type, status: factor.status }));
  return <main className="mx-auto min-h-screen max-w-3xl px-5 py-10">
    <h1 className="text-3xl font-semibold">Seguridad administrativa</h1>
    <AdminMfaEnrollment aal2 initialFactors={initialFactors} />
  </main>;
}
