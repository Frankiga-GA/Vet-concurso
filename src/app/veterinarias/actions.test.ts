import { beforeEach, describe, expect, it, vi } from "vitest";
import { requestAppointment } from "./actions";
import { intakeConfig, verifyIntakeToken } from "@/features/appointments/intake-security";

vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient: vi.fn() }));
vi.mock("@/features/appointments/intake-security", () => ({
  intakeConfig: vi.fn(), verifyIntakeToken: vi.fn(),
}));

function request(overrides: Record<string, string> = {}) {
  const form = new FormData();
  for (const [key, value] of Object.entries({
    clinicId: "c4400000-0000-4000-8000-000000000001",
    requestKey: "c6600000-0000-4000-8000-000000000001",
    name: "Contacto ficticio", phone: "999111222", reason: "Consulta ficticia",
    preferred: "2000-01-01T10:00", token: "fixture", website: "", ...overrides,
  })) form.set(key, value);
  return form;
}

describe("appointment request feedback", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(intakeConfig).mockReturnValue({
      intakeKey: "a".repeat(64),
    });
  });

  it("returns the phone error without consuming the challenge", async () => {
    const result = await requestAppointment({ message: "" }, request({ phone: "invalid" }));
    expect(result.fields?.phone).toBeTruthy();
    expect(verifyIntakeToken).not.toHaveBeenCalled();
  });

  it("identifies a past appointment time before verifying the challenge", async () => {
    const result = await requestAppointment({ message: "" }, request());
    expect(result.fields?.preferred).toBeTruthy();
    expect(verifyIntakeToken).not.toHaveBeenCalled();
  });
});
