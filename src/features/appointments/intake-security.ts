import "server-only";

const testSiteKey = "1x00000000000000000000AA";
const testSecretKey = "1x0000000000000000000000000000000AA";
export const challengeAction = "appointment_request";

export function intakeConfig() {
  const siteKey = process.env.VETIA_TURNSTILE_SITE_KEY;
  const secret = process.env.VETIA_TURNSTILE_SECRET_KEY;
  const intakeKey = process.env.VETIA_APPOINTMENT_INTAKE_KEY;
  if (!siteKey || !secret || !intakeKey || !/^[0-9a-f]{64}$/.test(intakeKey)) return null;
  try {
    const site = new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "");
    const backend = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "");
    const loopback = ["127.0.0.1", "localhost", "[::1]"];
    const test = siteKey === testSiteKey && secret === testSecretKey;
    const dummy = /^[123]x0/.test(siteKey) || /^[123]x0/.test(secret);
    if (dummy && (!test || !loopback.includes(site.hostname) || !loopback.includes(backend.hostname))) return null;
    if (!loopback.includes(site.hostname) && site.protocol !== "https:") return null;
    return { siteKey, secret, intakeKey, hostname: site.hostname, test };
  } catch {
    return null;
  }
}

export async function verifyChallenge(config: NonNullable<ReturnType<typeof intakeConfig>>, token: string) {
  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: new URLSearchParams({ secret: config.secret, response: token }),
      cache: "no-store",
      signal: AbortSignal.timeout(6000),
    });
    if (!response.ok) return false;
    const result = await response.json();
    return result.success === true && (config.test || (
      result.action === challengeAction && result.hostname === config.hostname
    ));
  } catch {
    return false;
  }
}
