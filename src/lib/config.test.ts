import { afterEach, describe, expect, it, vi } from "vitest";
import { getSupabaseConfigStatus } from "./config";

describe("Supabase configuration status", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("is false when required public variables are absent", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "");
    expect(getSupabaseConfigStatus()).toBe(false);
  });

  it("is true when both public variables exist", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "public-placeholder");
    expect(getSupabaseConfigStatus()).toBe(true);
  });
});
