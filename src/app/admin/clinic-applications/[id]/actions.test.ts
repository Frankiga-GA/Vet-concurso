import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { submitAdministrativeDecision } from "./actions";

const { rpc, requireAdmin, revalidate } = vi.hoisted(() => ({
  rpc: vi.fn(), requireAdmin: vi.fn(), revalidate: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth/session", () => ({ requirePlatformAdminAal2: requireAdmin }));
vi.mock("next/cache", () => ({ revalidatePath: revalidate }));

const input = {
  applicationId: "a2200000-0000-4000-8000-000000000001",
  operationId: "a3300000-0000-4000-8000-000000000001",
  expectedReviewedAt: "2026-11-06T15:00:00.123456+00:00",
  action: "approve",
  visibleMessage: "",
  internalNotes: " Nota privada ",
};
const receipt = {
  application_id: input.applicationId,
  review_id: "a4400000-0000-4000-8000-000000000001",
  status: "approved",
  clinic_id: "a5500000-0000-4000-8000-000000000001",
  reviewed_at: "2026-11-06T15:01:00.123456+00:00",
};

describe("submitAdministrativeDecision", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    requireAdmin.mockResolvedValue({ supabase: { rpc } });
  });
  afterEach(() => vi.unstubAllEnvs());

  it.each([undefined, "false", "1"])("blocks direct submissions when the flag is %s", async (flag) => {
    vi.stubEnv("VETIA_ADMIN_DECISIONS_ENABLED", flag);
    expect(await submitAdministrativeDecision(input)).toMatchObject({ ok: false });
    expect(requireAdmin).not.toHaveBeenCalled();
    expect(rpc).not.toHaveBeenCalled();
  });

  it.each(["reject", "request_information"])("requires a visible message for %s", async (action) => {
    vi.stubEnv("VETIA_ADMIN_DECISIONS_ENABLED", "true");
    expect(await submitAdministrativeDecision({ ...input, action, visibleMessage: "  " }))
      .toEqual({ ok: false, message: "Escribe un mensaje para el solicitante." });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("uses the SSR session, exact revision and unchanged operation UUID on retries", async () => {
    vi.stubEnv("VETIA_ADMIN_DECISIONS_ENABLED", "true");
    rpc.mockRejectedValueOnce(new Error("private transport details"))
      .mockResolvedValueOnce({ data: receipt, error: null });
    expect(await submitAdministrativeDecision(input)).toMatchObject({ ok: false });
    expect(revalidate).not.toHaveBeenCalled();
    expect(await submitAdministrativeDecision(input)).toEqual({ ok: true, receipt });
    expect(rpc.mock.calls[0]).toEqual(rpc.mock.calls[1]);
    expect(rpc).toHaveBeenLastCalledWith("vetia_review_clinic_application", {
      p_application_id: input.applicationId,
      p_operation_id: input.operationId,
      p_expected_reviewed_at: input.expectedReviewedAt,
      p_action: "approve",
      p_visible_message: null,
      p_internal_notes: "Nota privada",
    });
    expect(revalidate.mock.calls).toContainEqual(["/admin/clinic-applications"]);
    expect(revalidate.mock.calls).toContainEqual([`/admin/clinic-applications/${input.applicationId}`]);
  });

  it.each([
    ["PT409", "Applicant representation has not been verified", "acreditación vigente"],
    ["PT409", "Application changed or transition not allowed", "Recarga el detalle"],
    ["PT409", "Review operation key already used with different input", "otra decisión"],
    ["42501", "Recent TOTP verification required", "diez minutos"],
    ["42501", "unknown permissions", "no tiene autorización"],
    ["PT401", "unknown session", "ya no está vigente"],
    ["23505", "sensitive constraint and payload", "No pudimos confirmar"],
  ])("returns a safe message for %s (%s)", async (code, message, expected) => {
    vi.stubEnv("VETIA_ADMIN_DECISIONS_ENABLED", "true");
    rpc.mockResolvedValueOnce({ data: null, error: { code, message } });
    const result = await submitAdministrativeDecision(input);
    expect(result).toEqual({ ok: false, message: expect.stringContaining(expected) });
    expect(JSON.stringify(result)).not.toContain(message);
    expect(revalidate).not.toHaveBeenCalled();
  });
});
