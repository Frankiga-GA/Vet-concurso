import { describe, expect, it, vi, beforeEach } from "vitest";
import { signInWithGoogleAction } from "./actions";

const signInWithOAuth = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(() => Promise.resolve({
    auth: {
      signInWithOAuth,
    },
  })),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

describe("Google OAuth Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://vet-concurso.vercel.app");
  });

  it("initiates OAuth flow with provider google and correct callback url", async () => {
    signInWithOAuth.mockResolvedValue({
      data: { provider: "google", url: "https://accounts.google.com/o/oauth2/v2/auth?client_id=test" },
      error: null,
    });

    await expect(signInWithGoogleAction("/auth/login")).rejects.toThrow(
      "REDIRECT:https://accounts.google.com/o/oauth2/v2/auth?client_id=test"
    );

    expect(signInWithOAuth).toHaveBeenCalledWith({
      provider: "google",
      options: {
        redirectTo: "https://vet-concurso.vercel.app/auth/callback",
        queryParams: {
          access_type: "offline",
          prompt: "select_account",
        },
      },
    });
  });

  it("redirects to returnTo with error=oauth when provider fails", async () => {
    signInWithOAuth.mockResolvedValue({
      data: { provider: "google", url: null },
      error: { message: "Provider disabled" },
    });

    await expect(signInWithGoogleAction("/auth/register")).rejects.toThrow("REDIRECT:/auth/register?error=oauth");
  });
});
