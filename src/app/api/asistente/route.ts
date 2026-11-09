import { createHmac } from "node:crypto";
import { isIP } from "node:net";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { assistantChallenge, assistantConfig } from "@/features/assistant/config";
import { assistantInput, publicSuggestion } from "@/features/assistant/contract";
import { classifyWithGroq } from "@/features/assistant/provider";
import { appetiteFollowUp, appetiteGuidance, emergencyReply, hasUrgency, localConversationIntent, minimizePersonalData, renderGuidance } from "@/features/assistant/safety";
import { verifyTurnstile } from "@/lib/turnstile";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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
  let session;
  try {
    session = await createSupabaseServerClient();
  } catch {
    return json({ error: "Inicia sesión con un correo confirmado para usar el asistente." }, 401);
  }
  const { data: { user }, error: sessionError } = await session.auth.getUser();
  if (sessionError || !user || !user.email_confirmed_at) {
    return json({ error: "Inicia sesión con un correo confirmado para usar el asistente." }, 401);
  }
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
    if (quota.error || typeof quota.data !== "boolean") {
      console.warn("[vetia-assistant] quota unavailable", { code: quota.error?.code ?? "unexpected" });
      return json({ error: unavailable }, 503);
    }
    if (!quota.data) return json({ error: "Se alcanzó el límite de consultas. Intenta más tarde o usa el directorio." }, 429);
    const result = await classifyWithGroq(config.apiKey, config.model, messages.map(minimizePersonalData));
    if (!result.ok) {
      // Deliberately log only the failure category and HTTP status: never the
      // key, Turnstile token, IP bucket or veterinary conversation.
      console.warn(`[vetia-assistant] Groq unavailable stage=${result.stage} status=${result.status ?? "none"} reason=${result.reason ?? "none"} detail=${result.detail ?? "none"}`);
      return json({ error: unavailable }, 503);
    }
    const localIntent = localConversationIntent(messages.at(-1) ?? "");
    const conversationalIntent = ["greeting", "thanks", "capabilities"] as const;
    const classification = localIntent
      ? { ...result.classification, intent: localIntent, level: localIntent === "medication" ? "consult" as const : "general" as const, topic: "general" as const, question: localIntent === "greeting" || localIntent === "capabilities" ? "animal" as const : "none" as const }
      : conversationalIntent.includes(result.classification.intent as (typeof conversationalIntent)[number])
        ? { ...result.classification, intent: "symptom" as const, level: "clarify" as const, topic: "general" as const, question: "animal" as const }
        : result.classification;
    // If a local rule had to correct the intent, do not reuse wording that was
    // generated for the inconsistent intent. The safe local response wins.
    const useModelGuidance = !localIntent && classification === result.classification;
    const lastMessage = messages.at(-1) ?? "";
    const appetiteQuestion = appetiteFollowUp(lastMessage);
    const appetiteFallback = appetiteGuidance(lastMessage);
    const guidance = useModelGuidance && result.guidance
      ? { ...result.guidance, question: appetiteQuestion ?? result.guidance.question }
      : appetiteFallback;
    const reply = renderGuidance(classification, guidance);
    if (!reply.urgent && city) {
      const directory = await supabase.rpc("vetia_public_clinics", { p_city: city, p_slug: null });
      const parsed = z.array(publicSuggestion).safeParse(directory.data);
      if (!directory.error && parsed.success) reply.clinics = parsed.data.slice(0, 3);
    }
    return json(reply);
  } catch (error) {
    console.warn(`[vetia-assistant] internal request failure type=${error instanceof Error ? error.name : "unknown"}`);
    return json({ error: unavailable }, 503);
  }
}
