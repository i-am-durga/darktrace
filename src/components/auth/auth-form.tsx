"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Loader2 } from "lucide-react";
import type { AuthState } from "@/app/actions/auth";
import { createClient } from "@/lib/supabase/client";

type AuthAction = (state: AuthState, formData: FormData) => Promise<AuthState>;
type AuthMode = "login" | "register" | "forgot" | "reset";

const titles: Record<AuthMode, string> = {
  login: "Analyst sign in",
  register: "Create analyst account",
  forgot: "Reset your password",
  reset: "Choose a new password",
};

const descriptions: Record<AuthMode, string> = {
  login: "Access your intelligence workspace.",
  register: "Request access to the DarkTrace workspace.",
  forgot: "We will send a reset link if the address is registered.",
  reset: "Set a new password for your analyst account.",
};

export function AuthForm({ mode, action }: { mode: AuthMode; action: AuthAction }) {
  const [state, formAction, pending] = useActionState(action, {});
  const [googleLoading, setGoogleLoading] = useState(false);
  const [oauthError, setOauthError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const err = params.get("error");
      if (err) {
        if (err === "redirect_not_whitelisted" || err === "oauth_failed") {
          setOauthError("Google authentication redirect failed. Please verify that https://darktrace-security.vercel.app/** is added to Redirect URLs in your Supabase Dashboard.");
        } else {
          setOauthError(decodeURIComponent(err));
        }
      }
    }
  }, []);

  useEffect(() => {
    if (mode !== "reset") return;
    const supabase = createClient();
    if (supabase) void supabase.auth.getSession();
  }, [mode]);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setOauthError(null);
    try {
      const supabase = createClient();
      if (!supabase) {
        setOauthError("Supabase connection is not available.");
        setGoogleLoading(false);
        return;
      }
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        setOauthError(error.message);
        setGoogleLoading(false);
      }
    } catch {
      setOauthError("Unable to initiate Google sign-in. Check your browser connection.");
      setGoogleLoading(false);
    }
  };

  return (
    <div className="auth-form-wrap">
      <p className="eyebrow">Secure workspace</p>
      <h2>{titles[mode]}</h2>
      <p className="auth-intro">{descriptions[mode]}</p>

      <form action={formAction} className="auth-fields">
        {mode === "register" && (
          <label className="field" htmlFor="displayName">
            Display name
            <input id="displayName" name="displayName" type="text" autoComplete="name" required maxLength={80} />
          </label>
        )}
        {mode !== "reset" && (
          <label className="field" htmlFor="email">
            Email address
            <input id="email" name="email" type="email" autoComplete="email" required />
          </label>
        )}
        {(mode === "login" || mode === "register" || mode === "reset") && (
          <label className="field" htmlFor="password">
            {mode === "reset" ? "New password" : "Password"}
            <input id="password" name="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={8} required />
          </label>
        )}
        {mode === "reset" && (
          <label className="field" htmlFor="confirmPassword">
            Confirm new password
            <input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" minLength={8} required />
          </label>
        )}

        <button className="auth-button" type="submit" disabled={pending || googleLoading} id="btn-auth-submit">
          {pending ? "Please wait…" : mode === "login" ? "Sign in" : mode === "register" ? "Create account" : mode === "forgot" ? "Send reset link" : "Update password"}
          {!pending && <ArrowRight size={15} aria-hidden="true" />}
        </button>
      </form>

      {(mode === "login" || mode === "register") && (
        <div className="oauth-section">
          <div className="oauth-divider">
            <div className="oauth-divider-line" />
            <span>or</span>
            <div className="oauth-divider-line" />
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading || pending}
            className="auth-button google-auth-btn"
            id="btn-google-auth"
          >
            {googleLoading ? (
              <Loader2 size={16} className="spinner" />
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" style={{ flexShrink: 0 }}>
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.15z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.36 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.24C.45 8.15 0 9.99 0 12s.45 3.85 1.24 5.42l4.04-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
            )}
            {googleLoading
              ? "Connecting to Google…"
              : mode === "login"
              ? "Sign in with Google"
              : "Sign up with Google"}
          </button>
        </div>
      )}

      {(state.message || oauthError) && (
        <p className={`auth-message${state.error || oauthError ? " error" : ""}`} role="status" aria-live="polite">
          {oauthError || state.message}
        </p>
      )}

      <div className="auth-links">
        {mode === "login" && <Link href="/forgot-password">Forgot password?</Link>}
        {mode !== "login" && <Link href="/login">Return to sign in</Link>}
        {mode === "login" && <Link href="/register">Request an account</Link>}
      </div>
    </div>
  );
}
