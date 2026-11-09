import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { assistantConfig } from "./config";

vi.mock("server-only", () => ({}));
beforeEach(() => {
  vi.stubEnv("VETIA_AI_ENABLED", "true");
  vi.stubEnv("VETIA_AI_MODEL", "openai/gpt-oss-20b");
  vi.stubEnv("GROQ_API_KEY", "test-only");
  vi.stubEnv("VETIA_AI_GATEWAY_KEY", "a".repeat(64));
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "http://127.0.0.1:3138");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "http://127.0.0.1:54321");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "test-only");
});
afterEach(() => vi.unstubAllEnvs());

it("requires explicit enablement and the provider key", () => {
  vi.stubEnv("VETIA_AI_ENABLED", undefined);
  expect(assistantConfig()).toBeNull();
  vi.stubEnv("VETIA_AI_ENABLED", "true");
  vi.stubEnv("GROQ_API_KEY", undefined);
  expect(assistantConfig()).toBeNull();
});

it("requires a valid 64-hex gateway key for quota serialization", () => {
  vi.stubEnv("VETIA_AI_GATEWAY_KEY", "invalid-key");
  expect(assistantConfig()).toBeNull();
});

it("configures the allowed origin from NEXT_PUBLIC_SITE_URL or Vercel environment", () => {
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://vet-concurso.vercel.app");
  expect(assistantConfig()?.origin).toBe("https://vet-concurso.vercel.app");

  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
  vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "vet-concurso.vercel.app");
  expect(assistantConfig()?.origin).toBe("https://vet-concurso.vercel.app");
});
