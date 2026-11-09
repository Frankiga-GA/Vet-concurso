import "server-only";

export function assistantConfig() {
  if (process.env.VETIA_AI_ENABLED !== "true") return null;
  const apiKey = process.env.GROQ_API_KEY?.trim();
  const model = process.env.VETIA_AI_MODEL?.trim() || "openai/gpt-oss-20b";
  const gatewayKey = process.env.VETIA_AI_GATEWAY_KEY?.trim();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  if (!apiKey || !model || !gatewayKey || !/^[a-f0-9]{64}$/.test(gatewayKey) || !url || !publishableKey) {
    return null;
  }
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  let origin = "http://127.0.0.1:3000";
  if (siteUrl) {
    try { origin = new URL(siteUrl).origin; } catch {}
  } else if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    origin = `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }

  return { apiKey, model, gatewayKey, url, publishableKey, origin };
}
