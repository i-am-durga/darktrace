import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/auth-form";
import { AuthFrame } from "@/components/auth/auth-frame";
import { resetPassword } from "@/app/actions/auth";

export const metadata: Metadata = { title: "Choose new password" };

export default function ResetPasswordPage() {
  return <AuthFrame><AuthForm mode="reset" action={resetPassword} /></AuthFrame>;
}