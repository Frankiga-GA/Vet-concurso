import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

const { config, challenge, rpc, provider } = vi.hoisted(() => ({
  config: vi.fn(), challenge: vi.fn(), rpc: vi.fn(), provider: vi.fn(),
}));
vi.mock("@/features/assistant/config", () => ({ assistantConfig: config, assistantChallenge: "vetia_assistant" }));
vi.mock("@/lib/turnstile", () => ({ verifyTurnstile: challenge }));
vi.mock("@supabase/supabase-js", () => ({ createClient: () => ({ rpc }) }));
vi.mock("@/features/assistant/provider", () => ({ classifyWithOpenAI: provider }));

const input = { messages: ["Mi gato tiene picazón"], city: "Ica", token: "test-token" };
const origin = "http://127.0.0.1:3138";
function request(body: unknown = input, requestOrigin = origin) {
  return new Request(origin + "/api/asistente", {
    method: "POST", headers: { "Content-Type": "application/json", Origin: requestOrigin }, body: JSON.stringify(body),
  });
}

describe("assistant route security", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    config.mockReturnValue({ turnstile: { local: true, origin }, apiKey: "test-only", model: "test-model", gatewayKey: "a".repeat(64) });
    challenge.mockResolvedValue(true);
  });

  it("fails closed when disabled, for cross-origin calls or oversized bodies", async () => {
    config.mockReturnValueOnce(null);
    expect((await POST(request())).status).toBe(503);
    expect((await POST(request(input, "https://other.example.test"))).status).toBe(403);
    expect((await POST(request({ ...input, messages: ["a".repeat(13000)] }))).status).toBe(400);
    expect(challenge).not.toHaveBeenCalled();
    expect(provider).not.toHaveBeenCalled();
  });

  it("returns immediate urgent guidance without captcha, quota or external request", async () => {
    const response = await POST(request({ ...input, messages: ["No puede respirar"], token: "" }));
    expect(await response.json()).toMatchObject({ urgent: true, source: "safety", clinics: [] });
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(challenge).not.toHaveBeenCalled();
    expect(rpc).not.toHaveBeenCalled();
    expect(provider).not.toHaveBeenCalled();
  });

  it("blocks provider calls without a valid captcha and quota reservation", async () => {
    challenge.mockResolvedValueOnce(false);
    expect((await POST(request())).status).toBe(403);
    expect(rpc).not.toHaveBeenCalled();
    rpc.mockResolvedValueOnce({ data: false }).mockResolvedValueOnce({ error: { code: "42501" } });
    expect((await POST(request())).status).toBe(429);
    expect((await POST(request())).status).toBe(503);
    expect(provider).not.toHaveBeenCalled();
  });

  it("passes minimized text to the provider and shows clinics only from the public RPC", async () => {
    rpc.mockResolvedValueOnce({ data: true }).mockResolvedValueOnce({ data: [
      { slug: "fixture", name: "Fixture directory", city: "Ica", secretField: "discard" },
    ] });
    provider.mockResolvedValue({ level: "consult", topic: "skin", question: "onset" });
    const response = await POST(request({ ...input, messages: ["Mi gato se rasca. hola@example.test"] }));
    expect(provider).toHaveBeenCalledWith("test-only", "test-model", ["Mi gato se rasca. [correo omitido]"]);
    expect(rpc).toHaveBeenLastCalledWith("vetia_public_clinics", { p_city: "Ica", p_slug: null });
    expect(await response.json()).toMatchObject({ clinics: [{ slug: "fixture", name: "Fixture directory", city: "Ica" }] });
  });

  it("does not generate substitute AI guidance when the provider fails", async () => {
    rpc.mockResolvedValue({ data: true });
    provider.mockResolvedValue(null);
    expect((await POST(request())).status).toBe(503);
    expect(rpc).toHaveBeenCalledTimes(1);
  });
});
