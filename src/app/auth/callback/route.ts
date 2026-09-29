import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getSupabaseConfig } from "@/lib/supabase/config";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  // Determine actual public origin (handling reverse proxy / Vercel forwarded headers)
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") || "https";
  const appOrigin = forwardedHost ? `${forwardedProto}://${forwardedHost}` : origin;

  // If OAuth provider returned an error directly
  if (error || errorDescription) {
    const errorMsg = encodeURIComponent(errorDescription || error || "oauth_failed");
    return NextResponse.redirect(`${appOrigin}/login?error=${errorMsg}`);
  }

  if (code) {
    const config = getSupabaseConfig();
    if (config) {
      const redirectResponse = NextResponse.redirect(`${appOrigin}${next}`);

      const supabase = createServerClient(config.url, config.key, {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              redirectResponse.cookies.set(name, value, options);
            });
          },
        },
      });

      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      if (!exchangeError) {
        return redirectResponse;
      }

      console.error("OAuth code exchange error", exchangeError);
      const errorMsg = encodeURIComponent(exchangeError.message || "exchange_failed");
      return NextResponse.redirect(`${appOrigin}/login?error=${errorMsg}`);
    }
  }

  // Return user to login with helpful notice if redirect URL was not authorized
  return NextResponse.redirect(`${appOrigin}/login?error=redirect_not_whitelisted`);
}
