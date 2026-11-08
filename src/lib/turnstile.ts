import "server-only";

const testSiteKey = "1x00000000000000000000AA";
const testSecretKey = "1x0000000000000000000000000000000AA";
const loopback = ["127.0.0.1", "localhost", "[::1]"];

export function turnstileConfig(siteKey?: string, secret?: string) {
  if (!siteKey || !secret) return null;
  try {
    const site = new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "");
    const backend = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "");
    const local = loopback.includes(site.hostname) && loopback.includes(backend.hostname);
    const test = siteKey === testSiteKey && secret === testSecretKey;
    if ((/^[123]x0/.test(siteKey) || /^[123]x0/.test(secret)) && (!test || !local)) return null;
    if (!loopback.includes(site.hostname) && site.protocol !== "https:") return null;
    return { siteKey, secret, hostname: site.hostname, origin: site.origin, local, test };
  } catch {
    return null;
  }
}

export async function verifyTurnstile(config: { secret: string; hostname: string; test: boolean }, token: string, action: string) {
  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: new URLSearchParams({ secret: config.secret, response: token }),
      cache: "no-store",
      signal: AbortSignal.timeout(6000),
    });
    if (!response.ok) return false;
    const result = await response.json();
    return result.success === true && (config.test || (result.action === action && result.hostname === config.hostname));
  } catch {
    return false;
  }
}
