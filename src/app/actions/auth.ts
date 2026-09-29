"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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

  const supabase = await createClient();
  if (!supabase) return missingConfig();

  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { message: "Unable to sign in with those credentials.", error: true };

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

  if (error) return { message: error.message || "Unable to create the account. Check the details and try again.", error: true };

  // If Supabase has "Confirm email" disabled, a session is created immediately
  if (data?.session) {
    redirect("/dashboard");
  }

  // Supabase returns an empty identities array if the email already exists
  if (data?.user?.identities && data.user.identities.length === 0) {
    return { message: "An account with this email already exists. Please go to the sign-in page.", error: true };
  }

  return { message: "Account created! If email confirmation is enabled on your Supabase project, check your inbox (or spam folder) to confirm your address." };
}

export async function requestPasswordReset(
  _state: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = z.email().trim().safeParse(getField(formData, "email"));
  if (!parsed.success) return { message: "Enter a valid email address.", error: true };

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

