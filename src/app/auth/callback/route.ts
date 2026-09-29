import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  // If OAuth provider returned an error directly
  if (error || errorDescription) {
    const errorMsg = encodeURIComponent(errorDescription || error || "oauth_failed");
    return NextResponse.redirect(`${origin}/login?error=${errorMsg}`);
  }

  if (code) {
    const supabase = await createClient();
    if (supabase) {
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      if (!exchangeError) {
        return NextResponse.redirect(`${origin}${next}`);
      }
      console.error("OAuth code exchange error", exchangeError);
      const errorMsg = encodeURIComponent(exchangeError.message || "exchange_failed");
      return NextResponse.redirect(`${origin}/login?error=${errorMsg}`);
    }
  }

  // Return user to login with helpful notice if redirect URL was not authorized
  return NextResponse.redirect(`${origin}/login?error=redirect_not_whitelisted`);
}
