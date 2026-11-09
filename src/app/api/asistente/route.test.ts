import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";
import { _resetRateLimitsForTesting } from "@/features/assistant/rate-limit";

const { config, rpc, provider, getUser } = vi.hoisted(() => ({
  config: vi.fn(), rpc: vi.fn(), provider: vi.fn(), getUser: vi.fn(),
}));
vi.mock("@/features/assistant/config", () => ({ assistantConfig: config }));
vi.mock("@supabase/supabase-js", () => ({ createClient: () => ({ rpc }) }));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient: () => ({ auth: { getUser } }) }));
vi.mock("@/features/assistant/provider", () => ({ classifyWithGroq: provider }));

const input = { messages: ["Mi gato tiene picazón"], city: "Ica" };
const origin = "http://127.0.0.1:3138";
function request(body: unknown = input, requestOrigin = origin) {
  return new Request(origin + "/api/asistente", {
    method: "POST", headers: { "Content-Type": "application/json", Origin: requestOrigin }, body: JSON.stringify(body),
  });
}

describe("assistant route security", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    _resetRateLimitsForTesting();
    config.mockReturnValue({
      origin, apiKey: "test-only", model: "test-model", gatewayKey: "a".repeat(64),
      url: "http://127.0.0.1:54321", publishableKey: "test-only",
    });
    getUser.mockResolvedValue({
      data: { user: { id: "00000000-0000-4000-8000-000000000001", email_confirmed_at: "2026-01-01T00:00:00Z" } },
      error: null,
    });
  });

  it("fails closed when disabled, for cross-origin calls or oversized bodies", async () => {
    config.mockReturnValueOnce(null);
    expect((await POST(request())).status).toBe(503);
    expect((await POST(request(input, "https://other.example.test"))).status).toBe(403);
    expect((await POST(request({ ...input, messages: ["a".repeat(13000)] }))).status).toBe(400);
    expect(provider).not.toHaveBeenCalled();
  });

  it("requires an authenticated account with a confirmed email before using safety, quota or Groq", async () => {
    getUser.mockResolvedValueOnce({ data: { user: null }, error: null });
    expect((await POST(request())).status).toBe(401);
    getUser.mockResolvedValueOnce({ data: { user: { id: "test", email_confirmed_at: null } }, error: null });
    expect((await POST(request())).status).toBe(401);
    expect(rpc).not.toHaveBeenCalled();
    expect(provider).not.toHaveBeenCalled();
  });

  it("returns immediate urgent guidance with clinics from Supabase RPC without consuming quota or provider calls", async () => {
    rpc.mockResolvedValueOnce({
      data: [{ slug: "urgencias-ica", name: "Clínica Urgencias Ica", city: "Ica", address: "Av. Principal 123", phone: "+51 999 111 222" }],
    }).mockResolvedValueOnce({ data: [] });
    const response = await POST(request({ ...input, messages: ["No puede respirar"] }));
    expect(await response.json()).toMatchObject({
      urgent: true,
      source: "safety",
      clinics: [{ slug: "urgencias-ica", name: "Clínica Urgencias Ica", city: "Ica", address: "Av. Principal 123", phone: "+51 999 111 222" }],
    });
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(provider).not.toHaveBeenCalled();
    expect(rpc).toHaveBeenCalledWith("vetia_public_clinics", { p_city: "Ica", p_slug: null });
  });

  it("indicates when no clinics are available in the directory for an urgent consultation", async () => {
    rpc.mockResolvedValue({ data: [] });
    const response = await POST(request({ ...input, messages: ["Mi perro se está asfixiando"] }));
    const data = await response.json();
    expect(data).toMatchObject({ urgent: true, source: "safety", clinics: [] });
    expect(data.text).toContain("No se encontraron clínicas veterinarias disponibles en el directorio");
  });

  it("enforces atomic user quota reservation via Supabase RPC", async () => {
    rpc.mockResolvedValueOnce({ data: false });
    expect((await POST(request())).status).toBe(429);
    _resetRateLimitsForTesting();
    rpc.mockResolvedValueOnce({ error: { code: "42501" } });
    expect((await POST(request())).status).toBe(503);
    expect(provider).not.toHaveBeenCalled();
  });

  it("passes minimized text to the provider and shows clinics only from the public RPC", async () => {
    rpc.mockResolvedValueOnce({ data: true }).mockResolvedValue({ data: [
      { slug: "fixture", name: "Fixture directory", city: "Ica", address: "Calle Lima 123", phone: "+51 956 000 111", secretField: "discard" },
    ] });
    provider.mockResolvedValue({ ok: true, classification: { intent: "symptom", level: "consult", topic: "skin", question: "onset" } });
    const response = await POST(request({ ...input, messages: ["Mi gato se rasca. hola@example.test"] }));
    expect(provider).toHaveBeenCalledWith("test-only", "test-model", ["Mi gato se rasca. [correo omitido]"]);
    expect(rpc).toHaveBeenCalledWith("vetia_public_clinics", { p_city: "Ica", p_slug: null });
    expect(await response.json()).toMatchObject({ clinics: [{ slug: "fixture", name: "Fixture directory", city: "Ica" }] });
  });

  it("does not generate substitute AI guidance when the provider fails", async () => {
    rpc.mockResolvedValue({ data: true });
    provider.mockResolvedValue({ ok: false, stage: "response", status: 401 });
    expect((await POST(request())).status).toBe(503);
    expect(rpc).toHaveBeenCalledTimes(1);
  });

  it("does not let an inconsistent greeting label override a symptom turn", async () => {
    rpc.mockResolvedValue({ data: true });
    provider.mockResolvedValue({ ok: true, classification: { intent: "greeting", level: "general", topic: "general", question: "none" } });
    const response = await POST(request({ ...input, messages: ["Mi perro no quiere comer"] }));
    await expect(response.json()).resolves.toMatchObject({ urgent: false, question: "¿Desde cuándo ocurre? ¿Está bebiendo agua y se comporta como siempre?" });
  });

  it("returns validated provider wording for an ordinary symptom turn", async () => {
    rpc.mockResolvedValue({ data: true });
    provider.mockResolvedValue({ ok: true, classification: { intent: "symptom", level: "clarify", topic: "digestive", question: "onset" }, guidance: { text: "Entiendo que te preocupe; vigila si toma agua.", question: "¿Desde cuándo no quiere comer?" } });
    const response = await POST(request({ ...input, messages: ["Mi perro no quiere comer"] }));
    await expect(response.json()).resolves.toMatchObject({ text: "Entiendo que te preocupe; vigila si toma agua.", question: "¿Desde cuándo ocurre? ¿Está bebiendo agua y se comporta como siempre?" });
  });
});
