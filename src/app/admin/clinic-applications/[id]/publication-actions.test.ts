import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { submitClinicPublication } from "./publication-actions";

const { rpc, requireAdmin, revalidate } = vi.hoisted(() => ({
  rpc: vi.fn(), requireAdmin: vi.fn(), revalidate: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth/session", () => ({ requirePlatformAdminAal2: requireAdmin }));
vi.mock("next/cache", () => ({ revalidatePath: revalidate }));

const input = {
  clinicId: "80f52b8e-9740-4fb9-9d3e-f215452e7d47",
  operationId: "c2af0104-cc0e-4e5d-aa5f-b613b98ba09a",
  decision: "publish", profileRevision: 3, publicationRevision: 2, reason: "Revisión confirmada",
};
const receipt = { receiptId: input.operationId, publication: "published", publicationRevision: 3 };

describe("submitClinicPublication", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    requireAdmin.mockResolvedValue({ supabase: { rpc } });
  });
  afterEach(() => vi.unstubAllEnvs());

  it.each([undefined, "false"])("blocks direct submissions when the publication flag is %s", async (flag) => {
    vi.stubEnv("VETIA_CLINIC_PUBLICATION_ENABLED", flag);
    vi.stubEnv("VETIA_ADMIN_DECISIONS_ENABLED", "true");
    expect(await submitClinicPublication(input)).toMatchObject({ ok: false });
    expect(requireAdmin).not.toHaveBeenCalled();
    expect(rpc).not.toHaveBeenCalled();
  });

  it("uses the same key and revisions on a retry and invalidates views after a verified receipt", async () => {
    vi.stubEnv("VETIA_CLINIC_PUBLICATION_ENABLED", "true");
    rpc.mockRejectedValueOnce(new Error("Private details")).mockResolvedValueOnce({ data: receipt });
    expect(await submitClinicPublication(input)).toMatchObject({ ok: false });
    expect(revalidate).not.toHaveBeenCalled();
    expect(await submitClinicPublication(input)).toMatchObject({ ok: true });
    expect(rpc.mock.calls[0]).toEqual(rpc.mock.calls[1]);
    expect(rpc).toHaveBeenLastCalledWith("vetia_publish_clinic", expect.objectContaining({
      p_clinic_id: input.clinicId, p_operation_id: input.operationId,
      p_profile_revision: 3, p_publication_revision: 2,
    }));
    expect(revalidate).toHaveBeenCalledWith("/veterinarias");
  });

  it("routes withdrawal to its own RPC and rejects a mismatched receipt", async () => {
    vi.stubEnv("VETIA_CLINIC_PUBLICATION_ENABLED", "true");
    rpc.mockResolvedValue({ data: receipt });
    expect(await submitClinicPublication({ ...input, decision: "withdraw" })).toMatchObject({ ok: false });
    expect(rpc).toHaveBeenLastCalledWith("vetia_withdraw_clinic", expect.any(Object));
    expect(revalidate).not.toHaveBeenCalled();
  });
});
