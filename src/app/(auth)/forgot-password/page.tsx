import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/auth-form";
import { AuthFrame } from "@/components/auth/auth-frame";
import { requestPasswordReset } from "@/app/actions/auth";

export const metadata: Metadata = { title: "Reset password" };

export default function ForgotPasswordPage() {
  return <AuthFrame><AuthForm mode="forgot" action={requestPasswordReset} /></AuthFrame>;
}