import "server-only";

import { turnstileConfig, verifyTurnstile } from "@/lib/turnstile";
export const challengeAction = "appointment_request";

export function intakeConfig() {
  const siteKey = process.env.VETIA_TURNSTILE_SITE_KEY;
  const secret = process.env.VETIA_TURNSTILE_SECRET_KEY;
  const intakeKey = process.env.VETIA_APPOINTMENT_INTAKE_KEY;
  if (!intakeKey || !/^[0-9a-f]{64}$/.test(intakeKey)) return null;
  const config = turnstileConfig(siteKey, secret);
  return config ? { ...config, intakeKey } : null;
}

export async function verifyChallenge(config: Pick<NonNullable<ReturnType<typeof intakeConfig>>, "secret" | "hostname" | "test" | "siteKey" | "intakeKey">, token: string) {
  return verifyTurnstile(config, token, challengeAction);
}
