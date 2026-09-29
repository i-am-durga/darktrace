import type { Metadata } from "next";
import Link from "next/link";
import { AuthForm } from "@/components/auth/auth-form";
import { AuthFrame } from "@/components/auth/auth-frame";
import { register } from "@/app/actions/auth";

export const metadata: Metadata = { title: "Create account" };

export default function RegisterPage() {
  const registrationEnabled = process.env.ALLOW_SELF_SIGNUP === "true";

  return (
    <AuthFrame>
      {registrationEnabled ? <AuthForm mode="register" action={register} /> : (
        <div className="auth-form-wrap">
          <p className="eyebrow">Account access</p>
          <h2>Registration is closed</h2>
          <p className="auth-intro">Ask your workspace administrator to provision analyst access.</p>
          <div className="auth-links"><Link href="/login">Return to sign in</Link></div>
        </div>
      )}
    </AuthFrame>
  );
}