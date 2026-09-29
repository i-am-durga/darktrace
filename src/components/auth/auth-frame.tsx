import type { ReactNode } from "react";
import { Fingerprint, ShieldCheck } from "lucide-react";

export function AuthFrame({ children }: { children: ReactNode }) {
  const configured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );

  return (
    <main className="auth-frame">
      <section className="auth-story" aria-label="DarkTrace overview">
        <div className="brand-lockup">
          <span className="brand-mark"><Fingerprint size={19} strokeWidth={1.8} aria-hidden="true" /></span>
          <span><span className="brand-name">DarkTrace</span><span className="brand-subtitle">Intelligence platform</span></span>
        </div>
        <div className="story-copy">
          <span className="eyebrow">Defensive intelligence · Analyst reviewed</span>
          <h1>Signals become clearer when evidence connects.</h1>
          <p>Correlate observations, identifiers and infrastructure in a workspace built for careful, accountable threat research.</p>
        </div>
        <div className="story-rule"><ShieldCheck size={15} aria-hidden="true" /> Passive analysis. Human-led conclusions.</div>
      </section>
      <section className="auth-panel" aria-label="Account access">
        <div>
          {!configured && (
            <p className="auth-message" role="status">
              Supabase is not configured yet. Copy .env.example to .env.local, add your Supabase project URL and publishable key, then restart the development server.
            </p>
          )}
          {children}
        </div>
      </section>
    </main>
  );
}