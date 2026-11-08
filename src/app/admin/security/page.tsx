import { AdminMfaEnrollment } from "@/features/auth/admin-mfa-enrollment";
import { requirePlatformAdminAal2 } from "@/lib/auth/session";
import { AdminNav, PageIntro } from "@/components/vetia-ui";

export const dynamic = "force-dynamic";

export default async function AdminSecurityPage() {
  const { supabase } = await requirePlatformAdminAal2();
  const { data: factorData } = await supabase.auth.mfa.listFactors();
  const initialFactors = (factorData?.all ?? []).map((factor) => ({ id: factor.id, friendly_name: factor.friendly_name, factor_type: factor.factor_type, status: factor.status }));
  return <main className="vet-shell vet-page vet-narrow space-y-4">
    <AdminNav current="security" />
    <PageIntro title="Seguridad administrativa" label="Superadministración" />
    <AdminMfaEnrollment aal2 initialFactors={initialFactors} />
  </main>;
}
