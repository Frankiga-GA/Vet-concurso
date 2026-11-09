import { createHmac } from "node:crypto";
import { isIP } from "node:net";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { cities } from "@/features/appointments/contract";
import { assistantConfig } from "@/features/assistant/config";
import { assistantInput, publicSuggestion } from "@/features/assistant/contract";
import { classifyWithGroq } from "@/features/assistant/provider";
import { appetiteFollowUp, appetiteGuidance, emergencyReply, hasUrgency, localConversationIntent, minimizePersonalData, renderGuidance } from "@/features/assistant/safety";
import { checkServerRateLimit } from "@/features/assistant/rate-limit";
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

type SupabaseRpcClient = {
  rpc: (fn: string, args?: Record<string, unknown>) => Promise<{ data: unknown; error: unknown }>;
};

async function fetchUrgentOrSuggestedClinics(
  supabase: SupabaseRpcClient,
  preferredCity: (typeof cities)[number] | null
): Promise<z.infer<typeof publicSuggestion>[]> {
  const clinics: z.infer<typeof publicSuggestion>[] = [];
  const seenSlugs = new Set<string>();

  if (preferredCity) {
    const cityRes = await supabase.rpc("vetia_public_clinics", { p_city: preferredCity, p_slug: null });
    if (!cityRes.error && Array.isArray(cityRes.data)) {
      for (const item of cityRes.data) {
        const parsed = publicSuggestion.safeParse(item);
        if (parsed.success && !seenSlugs.has(parsed.data.slug)) {
          seenSlugs.add(parsed.data.slug);
          clinics.push(parsed.data);
          if (clinics.length === 3) return clinics;
        }
      }
    }
  }

  if (clinics.length < 3) {
    const allRes = await supabase.rpc("vetia_public_clinics", { p_city: null, p_slug: null });
    if (!allRes.error && Array.isArray(allRes.data)) {
      for (const item of allRes.data) {
        const parsed = publicSuggestion.safeParse(item);
        if (parsed.success && !seenSlugs.has(parsed.data.slug)) {
          seenSlugs.add(parsed.data.slug);
          clinics.push(parsed.data);
          if (clinics.length === 3) break;
        }
      }
    }
  }

  return clinics;
}

export async function POST(request: Request) {
  const config = assistantConfig();
  if (!config) return json({ error: unavailable }, 503);
  if (request.headers.get("origin") !== config.origin) return json({ error: "Origen no permitido." }, 403);

  // Mandatory Authentication with confirmed email
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
  const { messages, city, mode = "mascotas" } = body.data;

  // Urgent triage detection: provide immediate guidance and clinics without consuming quota
  if (hasUrgency(messages, mode)) {
    const supabase = createClient(config.url, config.publishableKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store", signal: AbortSignal.timeout(4000) }) },
    });
    const clinics = await fetchUrgentOrSuggestedClinics(supabase as unknown as SupabaseRpcClient, city).catch(() => []);
    return json(emergencyReply(clinics, mode));
  }

  // Client IP extraction & rate limiting
  const forwarded = request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim();
  const rawIp = forwarded || request.headers.get("x-real-ip")?.trim() || "127.0.0.1";
  const ip = isIP(rawIp) ? rawIp : "127.0.0.1";

  // Protection against automated rapid loops and flooding
  const ipCheck = checkServerRateLimit("ip", ip, 12, 60_000, 2_000);
  if (!ipCheck.ok) return json({ error: ipCheck.reason }, 429);

  const userCheck = checkServerRateLimit("user", user.id, 10, 60_000, 2_000);
  if (!userCheck.ok) return json({ error: userCheck.reason }, 429);

  try {
    const supabase = createClient(config.url, config.publishableKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store", signal: AbortSignal.timeout(4000) }) },
    });

    // Atomic Database Quota Reservation serialized per user ID
    const userBucket = createHmac("sha256", config.gatewayKey)
      .update(`user:${new Date().toISOString().slice(0, 10)}:${user.id}`).digest("hex");
    const quota = await supabase.rpc("vetia_reserve_assistant_turn", { p_gateway_key: config.gatewayKey, p_bucket: userBucket });
    if (quota.error || typeof quota.data !== "boolean") {
      console.warn("[vetia-assistant] quota unavailable", { code: quota.error?.code ?? "unexpected" });
      return json({ error: unavailable }, 503);
    }
    if (!quota.data) {
      return json({ error: "Se alcanzó el límite de consultas para tu cuenta. Intenta más tarde o usa el directorio." }, 429);
    }

    const result = mode === "agro"
      ? await classifyWithGroq(config.apiKey, config.model, messages.map(minimizePersonalData), "agro")
      : await classifyWithGroq(config.apiKey, config.model, messages.map(minimizePersonalData));
    if (!result.ok) {
      console.warn(`[vetia-assistant] Groq unavailable stage=${result.stage} status=${result.status ?? "none"} reason=${result.reason ?? "none"} detail=${result.detail ?? "none"}`);
      return json({ error: unavailable }, 503);
    }

    if (result.classification.level === "urgent") {
      const clinics = await fetchUrgentOrSuggestedClinics(supabase as unknown as SupabaseRpcClient, city).catch(() => []);
      return json(emergencyReply(clinics, mode));
    }

    const localIntent = localConversationIntent(messages.at(-1) ?? "");
    const conversationalIntent = ["greeting", "thanks", "capabilities"] as const;
    const classification = localIntent
      ? {
          ...result.classification,
          intent: localIntent,
          level: localIntent === "medication" ? ("consult" as const) : ("general" as const),
          topic: "general" as const,
          question: localIntent === "greeting" || localIntent === "capabilities" ? ("animal" as const) : ("none" as const),
        }
      : conversationalIntent.includes(result.classification.intent as (typeof conversationalIntent)[number])
        ? { ...result.classification, intent: "symptom" as const, level: "clarify" as const, topic: "general" as const, question: "animal" as const }
        : result.classification;

    const useModelGuidance = !localIntent && classification === result.classification;
    const lastMessage = messages.at(-1) ?? "";
    const appetiteQuestion = appetiteFollowUp(lastMessage);
    const appetiteFallback = appetiteGuidance(lastMessage);
    const guidance = useModelGuidance && result.guidance
      ? { ...result.guidance, question: appetiteQuestion ?? result.guidance.question }
      : appetiteFallback;

    let clinics: z.infer<typeof publicSuggestion>[] = [];
    if (city) {
      clinics = await fetchUrgentOrSuggestedClinics(supabase as unknown as SupabaseRpcClient, city).catch(() => []);
    }

    const reply = renderGuidance(classification, guidance, clinics, mode);
    return json(reply);
  } catch (error) {
    console.warn(`[vetia-assistant] internal request failure type=${error instanceof Error ? error.name : "unknown"}`);
    return json({ error: unavailable }, 503);
  }
}
