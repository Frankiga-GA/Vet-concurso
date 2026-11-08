import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { assistantConfig } from "./config";

vi.mock("server-only", () => ({}));
beforeEach(() => {
  vi.stubEnv("VETIA_AI_ENABLED", "true");
  vi.stubEnv("VETIA_AI_MODEL", "test-model");
  vi.stubEnv("OPENAI_API_KEY", "test-only");
  vi.stubEnv("VETIA_AI_GATEWAY_KEY", "a".repeat(64));
  vi.stubEnv("VETIA_AI_TURNSTILE_SITE_KEY", "1x00000000000000000000AA");
  vi.stubEnv("VETIA_AI_TURNSTILE_SECRET_KEY", "1x0000000000000000000000000000000AA");
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "http://127.0.0.1:3138");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "http://127.0.0.1:54321");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "test-only");
});
afterEach(() => vi.unstubAllEnvs());

it("requires explicit enablement and the provider key", () => {
  vi.stubEnv("VETIA_AI_ENABLED", undefined);
  expect(assistantConfig()).toBeNull();
  vi.stubEnv("VETIA_AI_ENABLED", "true");
  vi.stubEnv("OPENAI_API_KEY", undefined);
  expect(assistantConfig()).toBeNull();
});

it("permits test challenges only with both services on loopback", () => {
  expect(assistantConfig()?.turnstile).toMatchObject({ local: true, test: true });
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
  expect(assistantConfig()).toBeNull();
});

it("requires the trusted Vercel ingress for HTTPS hosting", () => {
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://vetia.example.test");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
  vi.stubEnv("VETIA_AI_TURNSTILE_SITE_KEY", "configured-site-key");
  vi.stubEnv("VETIA_AI_TURNSTILE_SECRET_KEY", "configured-test-secret");
  vi.stubEnv("VERCEL", undefined);
  expect(assistantConfig()).toBeNull();
  vi.stubEnv("VERCEL", "1");
  expect(assistantConfig()?.turnstile.origin).toBe("https://vetia.example.test");
});
