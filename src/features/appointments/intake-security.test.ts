import { afterEach, describe, expect, it, vi } from "vitest";
import { createIntakeToken, intakeConfig, verifyIntakeToken } from "./intake-security";

vi.mock("server-only", () => ({}));

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("appointment intake antispam security", () => {
  const testKey = "a".repeat(64);
  const testClinic = "c4400000-0000-4000-8000-000000000001";

  it("fails closed without a gateway key", () => {
    vi.stubEnv("VETIA_APPOINTMENT_INTAKE_KEY", "");
    expect(intakeConfig()).toBeNull();
  });

  it("succeeds with a valid 64-hex intake key", () => {
    vi.stubEnv("VETIA_APPOINTMENT_INTAKE_KEY", testKey);
    expect(intakeConfig()).toEqual({ intakeKey: testKey });
  });

  it("creates and verifies a legitimate human submission token", () => {
    const token = createIntakeToken(testKey, testClinic);
    // Token issued just now; with minSeconds=0, it verifies successfully
    expect(verifyIntakeToken(testKey, testClinic, token, 0)).toBe(true);
  });

  it("rejects tokens submitted for a different clinic", () => {
    const token = createIntakeToken(testKey, testClinic);
    expect(verifyIntakeToken(testKey, "c4400000-0000-4000-8000-000000000002", token, 0)).toBe(false);
  });

  it("rejects tampered or forged tokens", () => {
    const token = createIntakeToken(testKey, testClinic);
    const tampered = token.slice(0, -4) + "ffff";
    expect(verifyIntakeToken(testKey, testClinic, tampered, 0)).toBe(false);
    expect(verifyIntakeToken("b".repeat(64), testClinic, token, 0)).toBe(false);
  });

  it("rejects automated bot submissions that occur faster than humanly possible", () => {
    const token = createIntakeToken(testKey, testClinic);
    // Requires at least 2 seconds of human filling time
    expect(verifyIntakeToken(testKey, testClinic, token, 2)).toBe(false);
  });

  it("rejects expired or replayed tokens older than the allowed window", () => {
    const staleIssuedAt = (Date.now() - 3 * 3600 * 1000).toString(36);
    const payload = `${testClinic}:${staleIssuedAt}`;
    const { createHmac } = require("node:crypto");
    const hmac = createHmac("sha256", testKey).update(payload).digest("hex").slice(0, 32);
    const staleToken = `${payload}:${hmac}`;
    expect(verifyIntakeToken(testKey, testClinic, staleToken, 0, 120)).toBe(false);
  });
});
