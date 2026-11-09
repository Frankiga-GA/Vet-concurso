import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

function redirectWithinSite(path: string) {
  // Preserve the browser's origin; Next can normalize loopback hostnames internally.
  return new NextResponse(null, { status: 303, headers: { Location: path, "Cache-Control": "no-store" } });
}

function safeNextPath(requestedNext: string | null) {
  if (!requestedNext) return "/account";
  if (requestedNext === "/auth/update-password") return requestedNext;
  if (requestedNext === "/account/agro" || requestedNext === "/account/pets") return requestedNext;
  if (requestedNext.startsWith("/account") && !requestedNext.includes("//")) return requestedNext;
  return "/account";
}

export async function GET(request: NextRequest) {
  const authError = request.nextUrl.searchParams.get("error");
  if (authError) return redirectWithinSite("/auth/login?error=oauth");

  const code = request.nextUrl.searchParams.get("code");
  const requestedNext = request.nextUrl.searchParams.get("next");
  const nextPath = safeNextPath(requestedNext);
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!code || !url || !key) return redirectWithinSite("/auth/login?error=callback");

  const response = redirectWithinSite(nextPath);
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options)),
    },
  });
  const { data: sessionData, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return redirectWithinSite("/auth/login?error=callback");

  // Si se especificó modalidad o el usuario tiene cuenta agro, sincronizar
  const user = sessionData?.user;
  if (user && (requestedNext === "/account/agro" || user.user_metadata?.account_type === "agro")) {
    const { error: profileError } = await supabase.from("profiles").upsert(
      {
        user_id: user.id,
        account_type: "agro",
      },
      { onConflict: "user_id" }
    );
    if (profileError) {
      console.warn("[auth/callback] profile sync warning", profileError.message);
    }
  }

  return response;
}
