import { afterEach, describe, expect, it, vi } from "vitest";
import { intakeConfig, verifyChallenge } from "./intake-security";

vi.mock("server-only", () => ({}));

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("appointment intake challenge", () => {
  it("fails closed without a gateway key", () => {
    vi.stubEnv("VETIA_APPOINTMENT_INTAKE_KEY", "");
    expect(intakeConfig()).toBeNull();
  });

  it("rejects dummy challenge keys with a non-loopback Supabase URL", () => {
    vi.stubEnv("VETIA_APPOINTMENT_INTAKE_KEY", "a".repeat(64));
    vi.stubEnv("VETIA_TURNSTILE_SITE_KEY", "1x00000000000000000000AA");
    vi.stubEnv("VETIA_TURNSTILE_SECRET_KEY", "1x0000000000000000000000000000000AA");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "http://localhost:3000");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    expect(intakeConfig()).toBeNull();
  });

  it("rejects a success response from the wrong hostname or action", async () => {
    const config = { siteKey: "example", secret: "example", intakeKey: "example", hostname: "example.test", test: false };
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(Response.json({ success: true, hostname: "other.test", action: "appointment_request" }))
      .mockResolvedValueOnce(Response.json({ success: true, hostname: "example.test", action: "other_action" }))
      .mockResolvedValueOnce(Response.json({ success: true, hostname: "example.test", action: "appointment_request" }));
    vi.stubGlobal("fetch", fetchMock);
    expect(await verifyChallenge(config, "token")).toBe(false);
    expect(await verifyChallenge(config, "token")).toBe(false);
    expect(await verifyChallenge(config, "token")).toBe(true);
  });
});
