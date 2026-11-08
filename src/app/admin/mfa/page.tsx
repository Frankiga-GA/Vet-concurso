import { redirect } from "next/navigation";
import { AdminMfaEnrollment } from "@/features/auth/admin-mfa-enrollment";
import { hasPlatformAdminAal2, requirePlatformAdminRole } from "@/lib/auth/session";
import { Brand, PageIntro } from "@/components/vetia-ui";

export const dynamic = "force-dynamic";

export default async function AdminMfaPage() {
  const { supabase } = await requirePlatformAdminRole();
  if (await hasPlatformAdminAal2(supabase)) redirect("/admin");
  const { data, error } = await supabase.auth.mfa.listFactors();
  const initialFactors = (data?.all ?? []).map(({ id, friendly_name, factor_type, status }) => ({
    id, friendly_name, factor_type, status,
  }));
  return <main className="vet-shell vet-page max-w-lg">
    <section className="vet-card space-y-4">
      <Brand />
      <PageIntro title="Protege el acceso administrativo" label="Superadministración" />
      <AdminMfaEnrollment aal2={false} initialFactors={initialFactors} initialListFailed={Boolean(error)} />
    </section>
  </main>;
}
