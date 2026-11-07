import { beforeEach, describe, expect, it, vi } from "vitest";
import { requirePlatformAdminAal2, requirePlatformAdminRole } from "./session";

const { createClient, getUser, rpc, getClaims } = vi.hoisted(() => ({
  createClient: vi.fn(), getUser: vi.fn(), rpc: vi.fn(), getClaims: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient: createClient }));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => { throw new Error(url); },
}));

describe("platform admin access", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    createClient.mockResolvedValue({ rpc, auth: { getUser, getClaims } });
    getUser.mockResolvedValue({ data: { user: { id: "admin", email_confirmed_at: "confirmed" } } });
    rpc.mockResolvedValue({ data: true, error: null });
    getClaims.mockResolvedValue({ data: { claims: { aal: "aal2" } }, error: null });
  });

  it("requires a valid session and confirmed email before checking the role", async () => {
    getUser.mockResolvedValueOnce({ data: { user: null }, error: new Error("expired") });
    await expect(requirePlatformAdminAal2()).rejects.toThrow("/auth/login?error=session-required");
    getUser.mockResolvedValueOnce({ data: { user: { id: "admin" } } });
    await expect(requirePlatformAdminAal2()).rejects.toThrow("/auth/check-email");
    expect(rpc).not.toHaveBeenCalled();
  });

  it("denies a user without the role even at AAL2", async () => {
    rpc.mockResolvedValueOnce({ data: false, error: null });
    await expect(requirePlatformAdminAal2()).rejects.toThrow("/admin/access");
    expect(getClaims).not.toHaveBeenCalled();
  });

  it("fails closed if the role check is unavailable", async () => {
    rpc.mockResolvedValueOnce({ data: null, error: new Error("unavailable") });
    await expect(requirePlatformAdminAal2()).rejects.toThrow("/admin/access?reason=unavailable");
  });

  it("allows role discovery at AAL1 while routing operational access to MFA", async () => {
    getClaims.mockResolvedValue({ data: { claims: { aal: "aal1" } }, error: null });
    await expect(requirePlatformAdminRole()).resolves.toMatchObject({ user: { id: "admin" } });
    expect(getClaims).not.toHaveBeenCalled();
    await expect(requirePlatformAdminAal2()).rejects.toThrow("/admin/mfa");
  });

  it("rejects a session whose claims cannot be verified", async () => {
    getClaims.mockResolvedValueOnce({ data: null, error: new Error("expired") });
    await expect(requirePlatformAdminAal2()).rejects.toThrow("/auth/login?error=session-required");
  });

  it("allows a confirmed administrator with verified AAL2 claims", async () => {
    await expect(requirePlatformAdminAal2()).resolves.toMatchObject({ user: { id: "admin" } });
  });
});
