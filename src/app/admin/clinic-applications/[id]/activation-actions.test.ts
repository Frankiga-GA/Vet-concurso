import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { activateClinic } from "./activation-actions";

const { rpc, authorize, revalidate } = vi.hoisted(() => ({
  rpc: vi.fn(), authorize: vi.fn(), revalidate: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth/session", () => ({ requirePlatformAdminAal2: authorize }));
vi.mock("next/cache", () => ({ revalidatePath: revalidate }));

const input = {
  clinicId: "80f52b8e-9740-4fb9-9d3e-f215452e7d47",
  expectedReviewedAt: "2026-11-07T18:30:40.123456+00:00",
  operationId: "c2af0104-cc0e-4e5d-aa5f-b613b98ba09a",
};

describe("activateClinic", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    authorize.mockResolvedValue({ supabase: { rpc } });
  });
  afterEach(() => vi.unstubAllEnvs());

  it.each([undefined, "false"])("blocks activation when administrative decisions are %s", async (flag) => {
    vi.stubEnv("VETIA_ADMIN_DECISIONS_ENABLED", flag);
    expect(await activateClinic(input)).toMatchObject({ ok: false });
    expect(authorize).not.toHaveBeenCalled();
    expect(rpc).not.toHaveBeenCalled();
  });

  it("rejects extra identity fields before reaching the RPC", async () => {
    vi.stubEnv("VETIA_ADMIN_DECISIONS_ENABLED", "true");
    expect(await activateClinic({ ...input, userId: input.clinicId })).toMatchObject({ ok: false });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("requires AAL2 and sends the exact approval revision and operation ID on retries", async () => {
    vi.stubEnv("VETIA_ADMIN_DECISIONS_ENABLED", "true");
    rpc.mockRejectedValueOnce(new Error("private failure")).mockResolvedValueOnce({ data: {
      receipt_id: input.operationId, clinic_id: input.clinicId,
      activated_at: input.expectedReviewedAt, lifecycle_status: "active", membership_status: "active",
    } });
    expect(await activateClinic(input)).toMatchObject({ ok: false });
    expect(revalidate).not.toHaveBeenCalled();
    expect(await activateClinic(input)).toMatchObject({ ok: true });
    expect(authorize).toHaveBeenCalledTimes(2);
    expect(rpc.mock.calls[0]).toEqual(rpc.mock.calls[1]);
    expect(rpc).toHaveBeenCalledWith("vetia_activate_clinic", {
      p_clinic_id: input.clinicId, p_expected_reviewed_at: input.expectedReviewedAt, p_operation_id: input.operationId,
    });
    expect(revalidate).toHaveBeenCalledWith("/clinic");
  });

  it("surfaces the missing recent TOTP check without exposing unexpected errors", async () => {
    vi.stubEnv("VETIA_ADMIN_DECISIONS_ENABLED", "true");
    rpc.mockResolvedValue({ error: { code: "42501", message: "Recent TOTP verification required" } });
    expect(await activateClinic(input)).toMatchObject({ ok: false, message: expect.stringContaining("TOTP") });
    expect(revalidate).not.toHaveBeenCalled();
  });
});
