export type FactorView = { id: string; friendly_name?: string; factor_type: string; status: string };

export function isPendingTotp(factor: FactorView) {
  return factor.factor_type === "totp" && factor.status === "unverified";
}

type MfaClient = {
  listFactors(): Promise<{ data: { all: FactorView[] } | null; error: unknown }>;
  unenroll(params: { factorId: string }): Promise<{ error: unknown }>;
};

export async function cancelPendingTotp(mfa: MfaClient, factorId: string) {
  const { data, error } = await mfa.listFactors();
  if (error || !data) throw new Error("Could not list MFA factors");
  if (!data.all.some((factor) => factor.id === factorId && isPendingTotp(factor))) {
    return { cancelled: false, factors: data.all };
  }

  const result = await mfa.unenroll({ factorId });
  if (result.error) throw new Error("Could not cancel pending TOTP enrollment");
  return { cancelled: true, factors: data.all.filter((factor) => factor.id !== factorId) };
}
