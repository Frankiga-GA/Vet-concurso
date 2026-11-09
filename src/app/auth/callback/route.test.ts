import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

const exchangeCodeForSession = vi.hoisted(() => vi.fn());
vi.mock("@supabase/ssr", () => ({
  createServerClient: () => ({ auth: { exchangeCodeForSession } }),
}));

describe("Auth callback", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "http://127.0.0.1:54321");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "test-key");
    exchangeCodeForSession.mockResolvedValue({ error: null });
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetAllMocks();
  });

  it("returns the recovery route without changing the browser origin", async () => {
    const response = await GET(new NextRequest("http://localhost:3000/auth/callback?code=test&next=/auth/update-password"));
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("/auth/update-password");
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("does not redirect to a user-supplied origin", async () => {
    const response = await GET(new NextRequest("http://localhost:3000/auth/callback?code=test&next=//external.example"));
    expect(response.headers.get("location")).toBe("/account");
  });

  it("handles an invalid or used code", async () => {
    exchangeCodeForSession.mockResolvedValue({ error: { message: "invalid code" } });
    const response = await GET(new NextRequest("http://localhost:3000/auth/callback?code=test"));
    expect(response.headers.get("location")).toBe("/auth/login?error=callback");
  });

  it("redirects to login with oauth error if provider returns an error", async () => {
    const response = await GET(new NextRequest("http://localhost:3000/auth/callback?error=access_denied"));
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("/auth/login?error=oauth");
  });
});
