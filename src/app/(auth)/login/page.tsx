import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/auth-form";
import { AuthFrame } from "@/components/auth/auth-frame";
import { login } from "@/app/actions/auth";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return <AuthFrame><AuthForm mode="login" action={login} /></AuthFrame>;
}