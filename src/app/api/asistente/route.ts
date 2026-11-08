import { createHmac } from "node:crypto";
import { isIP } from "node:net";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { assistantChallenge, assistantConfig } from "@/features/assistant/config";
import { assistantInput, publicSuggestion } from "@/features/assistant/contract";
import { classifyWithOpenAI } from "@/features/assistant/provider";
import { emergencyReply, hasUrgency, minimizePersonalData, renderGuidance } from "@/features/assistant/safety";
import { verifyTurnstile } from "@/lib/turnstile";

const bodyLimit = 12288;
const unavailable = "El asistente no está disponible. Puedes consultar el directorio y contactar a una veterinaria.";

function json(data: object, status = 200) {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

async function boundedJson(request: Request): Promise<unknown> {
  if (Number(request.headers.get("content-length")) > bodyLimit) throw new Error("oversize");
  if (!request.body) throw new Error("missing body");
  const reader = request.body.getReader();
  let size = 0;
  let value = "";
  const decoder = new TextDecoder("utf-8", { fatal: true });
  for (;;) {
    const { done, value: chunk } = await reader.read();
    if (done) break;
    size += chunk.byteLength;
    if (size > bodyLimit) {
      await reader.cancel();
      throw new Error("oversize");
    }
    value += decoder.decode(chunk, { stream: true });
  }
  return JSON.parse(value + decoder.decode());
}

export async function POST(request: Request) {
  const config = assistantConfig();
  if (!config) return json({ error: unavailable }, 503);
  if (request.headers.get("origin") !== config.turnstile.origin) return json({ error: "Origen no permitido." }, 403);
  if (request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") {
    return json({ error: "Formato de consulta no válido." }, 415);
  }
  const body = assistantInput.safeParse(await boundedJson(request).catch(() => null));
  if (!body.success) return json({ error: "Revisa la longitud y el formato de la consulta." }, 400);
  const { messages, city, token } = body.data;
  if (hasUrgency(messages)) return json(emergencyReply());

  const ip = config.turnstile.local ? "127.0.0.1" : request.headers.get("x-vercel-forwarded-for")?.trim();
  if (!ip || !isIP(ip)) return json({ error: unavailable }, 503);
  if (!token || !(await verifyTurnstile(config.turnstile, token, assistantChallenge))) {
    return json({ error: "Completa la verificación de seguridad para enviar tu consulta." }, 403);
  }

  try {
    const supabase = createClient(config.url, config.publishableKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store", signal: AbortSignal.timeout(4000) }) },
    });
    const bucket = createHmac("sha256", config.gatewayKey)
      .update(`assistant:${new Date().toISOString().slice(0, 10)}:${ip}`).digest("hex");
    const quota = await supabase.rpc("vetia_reserve_assistant_turn", { p_gateway_key: config.gatewayKey, p_bucket: bucket });
    if (quota.error || typeof quota.data !== "boolean") return json({ error: unavailable }, 503);
    if (!quota.data) return json({ error: "Se alcanzó el límite de consultas. Intenta más tarde o usa el directorio." }, 429);
    const result = await classifyWithOpenAI(config.apiKey, config.model, messages.map(minimizePersonalData));
    if (!result) return json({ error: unavailable }, 503);
    const reply = renderGuidance(result);
    if (!reply.urgent && city) {
      const directory = await supabase.rpc("vetia_public_clinics", { p_city: city, p_slug: null });
      const parsed = z.array(publicSuggestion).safeParse(directory.data);
      if (!directory.error && parsed.success) reply.clinics = parsed.data.slice(0, 3);
    }
    return json(reply);
  } catch {
    return json({ error: unavailable }, 503);
  }
}
