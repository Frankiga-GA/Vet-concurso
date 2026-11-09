import "server-only";

import { turnstileConfig } from "@/lib/turnstile";

export const assistantChallenge = "vetia_assistant";

export function assistantConfig() {
  if (process.env.VETIA_AI_ENABLED !== "true") return null;
  const apiKey = process.env.GROQ_API_KEY?.trim();
  const model = process.env.VETIA_AI_MODEL?.trim();
  const gatewayKey = process.env.VETIA_AI_GATEWAY_KEY;
  const turnstile = turnstileConfig(process.env.VETIA_AI_TURNSTILE_SITE_KEY, process.env.VETIA_AI_TURNSTILE_SECRET_KEY);
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!apiKey || !model || !gatewayKey || !/^[a-f0-9]{64}$/.test(gatewayKey) || !turnstile || !url || !publishableKey) return null;
  if (!turnstile.local && (process.env.VERCEL !== "1" || !url.startsWith("https://"))) return null;
  return { apiKey, model, gatewayKey, turnstile, url, publishableKey };
}
