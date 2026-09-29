"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { authRateLimiter } from "@/lib/rate-limit";

export type AuthState = {
  message?: string;
  error?: boolean;
};

const credentialsSchema = z.object({
  email: z.email().trim(),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

const registrationSchema = credentialsSchema.extend({
  displayName: z.string().trim().min(2, "Enter your name.").max(80),
});

function getField(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function validationError(error: z.ZodError): AuthState {
  return { message: error.issues[0]?.message ?? "Check the information and try again.", error: true };
}

function missingConfig(): AuthState {
  return {
    message: "Authentication is not configured. Add the Supabase URL and publishable key to .env.local, then restart the server.",
    error: true,
  };
}

function getSiteOrigin(): string | null {
  const configuredOrigin = process.env.NEXT_PUBLIC_SITE_URL;
  if (!configuredOrigin) {
    return process.env.NODE_ENV === "production" ? null : "http://localhost:3000";
  }

  try {
    const url = new URL(configuredOrigin);
    if (url.username || url.password || url.pathname !== "/" || url.search || url.hash) return null;
    if (process.env.NODE_ENV === "production" && url.protocol !== "https:") return null;
    if (url.protocol !== "https:" && url.hostname !== "localhost" && url.hostname !== "127.0.0.1") return null;
    return url.origin;
  } catch {
    return null;
  }
}

export async function login(_state: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = credentialsSchema.safeParse({
    email: getField(formData, "email"),
    password: getField(formData, "password"),
  });
  if (!parsed.success) return validationError(parsed.error);

  // Rate limit protection against brute force credential stuffing
  const rateKey = `login:${parsed.data.email.toLowerCase()}`;
  const limitCheck = authRateLimiter.check(rateKey);
  if (!limitCheck.success) {
    const waitSec = Math.ceil(limitCheck.resetMs / 1000);
    return {
      message: `Too many sign-in attempts. Please wait ${waitSec} seconds before trying again.`,
      error: true,
    };
  }

  const supabase = await createClient();
  if (!supabase) return missingConfig();

  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { message: "Unable to sign in with those credentials.", error: true };

  // Clear failed attempt record on successful authentication
  authRateLimiter.reset(rateKey);

  redirect("/dashboard");
}

export async function register(_state: AuthState, formData: FormData): Promise<AuthState> {
  if (process.env.ALLOW_SELF_SIGNUP !== "true") {
    return { message: "Self-service registration is disabled. Contact your workspace administrator for access.", error: true };
  }

  const parsed = registrationSchema.safeParse({
    displayName: getField(formData, "displayName"),
    email: getField(formData, "email"),
    password: getField(formData, "password"),
  });
  if (!parsed.success) return validationError(parsed.error);

  const rateKey = `register:${parsed.data.email.toLowerCase()}`;
  const limitCheck = authRateLimiter.check(rateKey);
  if (!limitCheck.success) {
    return { message: "Too many registration attempts. Please wait a minute before trying again.", error: true };
  }

  const supabase = await createClient();
  if (!supabase) return missingConfig();

  const appOrigin = getSiteOrigin() || "http://localhost:3000";

  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { display_name: parsed.data.displayName },
      emailRedirectTo: `${appOrigin}/dashboard`,
    },
  });

  if (error) {
    // Log for debugging but never leak raw Supabase error messages to the client
    console.error("Registration error", { code: error.code });
    return { message: "Unable to create the account. Check the details and try again.", error: true };
  }

  // If Supabase has "Confirm email" disabled, a session is created immediately
  if (data?.session) {
    redirect("/dashboard");
  }

  // Supabase returns an empty identities array if the email already exists.
  // Return the same success message to prevent user enumeration attacks.
  if (data?.user?.identities && data.user.identities.length === 0) {
    return { message: "If this email is not yet registered, a confirmation link has been sent. Check your inbox or spam folder." };
  }

  return { message: "Account created! If email confirmation is enabled on your Supabase project, check your inbox (or spam folder) to confirm your address." };
}

export async function requestPasswordReset(
  _state: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = z.email().trim().safeParse(getField(formData, "email"));
  if (!parsed.success) return { message: "Enter a valid email address.", error: true };

  const rateKey = `reset:${parsed.data.toLowerCase()}`;
  const limitCheck = authRateLimiter.check(rateKey);
  if (!limitCheck.success) {
    return { message: "Too many reset requests. Please wait a minute before requesting another link.", error: true };
  }

  const supabase = await createClient();
  if (!supabase) return missingConfig();

  const appOrigin = getSiteOrigin();
  if (!appOrigin) {
    return {
      message: "Password reset is unavailable because the app's canonical HTTPS URL is not configured.",
      error: true,
    };
  }
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, {
    redirectTo: `${appOrigin}/reset-password`,
  });
  if (error) return { message: "Unable to send a reset link right now.", error: true };

  return { message: "If an account exists for that address, a reset link will arrive shortly." };
}

export async function resetPassword(
  _state: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const password = getField(formData, "password");
  const confirmation = getField(formData, "confirmPassword");
  const parsed = credentialsSchema.shape.password.safeParse(password);
  if (!parsed.success) return { message: parsed.error.issues[0]?.message, error: true };
  if (password !== confirmation) return { message: "Passwords do not match.", error: true };

  const supabase = await createClient();
  if (!supabase) return missingConfig();

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { message: "Unable to update the password. Request a new reset link and try again.", error: true };

  redirect("/dashboard");
}

export async function logout() {
  const supabase = await createClient();
  if (supabase) await supabase.auth.signOut();
  redirect("/login");
}

