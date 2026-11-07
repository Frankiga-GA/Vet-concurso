import { describe, expect, it, vi } from "vitest";
import { cancelPendingTotp } from "./pending-totp";

const pending = { id: "pending", factor_type: "totp", status: "unverified" };
const verified = { id: "verified", factor_type: "totp", status: "verified" };
const phone = { id: "phone", factor_type: "phone", status: "unverified" };

function client() {
  return {
    listFactors: vi.fn().mockResolvedValue({ data: { all: [pending, verified, phone] }, error: null }),
    unenroll: vi.fn().mockResolvedValue({ error: null }),
  };
}

describe("cancel pending TOTP", () => {
  it("removes the selected pending TOTP and preserves other factors", async () => {
    const mfa = client();
    await expect(cancelPendingTotp(mfa, pending.id)).resolves.toEqual({
      cancelled: true, factors: [verified, phone],
    });
    expect(mfa.listFactors).toHaveBeenCalledOnce();
    expect(mfa.unenroll).toHaveBeenCalledExactlyOnceWith({ factorId: pending.id });
  });

  it.each([verified.id, phone.id, "absent"])("does not remove %s", async (id) => {
    const mfa = client();
    await expect(cancelPendingTotp(mfa, id)).resolves.toMatchObject({ cancelled: false });
    expect(mfa.unenroll).not.toHaveBeenCalled();
  });

  it("does not remove a formerly pending factor that is now verified", async () => {
    const mfa = client();
    mfa.listFactors.mockResolvedValue({ data: { all: [{ ...pending, status: "verified" }] }, error: null });
    await expect(cancelPendingTotp(mfa, pending.id)).resolves.toMatchObject({ cancelled: false });
    expect(mfa.unenroll).not.toHaveBeenCalled();
  });

  it("fails closed when listing factors fails", async () => {
    const mfa = client();
    mfa.listFactors.mockResolvedValue({ data: null, error: new Error("list failed") });
    await expect(cancelPendingTotp(mfa, pending.id)).rejects.toThrow("Could not list MFA factors");
    expect(mfa.unenroll).not.toHaveBeenCalled();
  });

  it("does not confirm cancellation when Supabase rejects it", async () => {
    const mfa = client();
    mfa.unenroll.mockResolvedValue({ error: new Error("unenroll failed") });
    await expect(cancelPendingTotp(mfa, pending.id)).rejects.toThrow("Could not cancel pending TOTP enrollment");
  });
});
