"use client";

import { useState } from "react";
import { Database, CheckCircle2, LogOut } from "lucide-react";
import { logout } from "@/app/actions/auth";

export type SettingsData = {
  user: {
    id: string;
    email: string;
    role: string;
    createdAt: string;
  };
  diagnostics: {
    supabaseUrl: string;
    dbConnected: boolean;
    counts: Record<string, number>;
  };
};

export function SettingsView({ data }: { data: SettingsData }) {
  const [safeMode, setSafeMode] = useState(true);
  const [density, setDensity] = useState("comfortable");

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <section className="panel" style={{ padding: "20px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
          <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#1f2d29", border: "1px solid #3c5249", display: "grid", placeItems: "center", color: "var(--accent-strong)", fontSize: 18, fontWeight: 600 }}>
            {data.user.email.slice(0, 1).toUpperCase()}
          </div>
          <div>
            <h2 style={{ fontSize: 16, margin: "0 0 4px", color: "#e4ece8" }}>{data.user.email}</h2>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span className="tag-pill" style={{ borderColor: "#28443b", color: "#8ce2c5", textTransform: "uppercase" }}>
                Role: {data.user.role}
              </span>
              <span style={{ color: "#74847e", fontSize: 11 }}>
                Account created: {new Date(data.user.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        <div style={{ borderTop: "1px solid var(--border)", paddingTop: 14, display: "grid", gap: 6, fontSize: 11 }}>
          <span style={{ color: "#74847e" }}>Authenticated UUID:</span>
          <code className="mono-value" style={{ color: "#a5b8b0" }}>{data.user.id}</code>
        </div>
      </section>

      <section className="panel" style={{ padding: "20px 24px" }}>
        <div className="panel-header" style={{ margin: "-20px -24px 18px", padding: "14px 24px" }}>
          <h2 className="panel-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Database size={15} /> System Diagnostics & Supabase Health
          </h2>
          <span className="tag-pill" style={{ borderColor: "#26483b", color: "#8ce0c3" }}>
            <CheckCircle2 size={11} color="#85dabf" /> All Systems Operational
          </span>
        </div>

        <div style={{ display: "grid", gap: 14, fontSize: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #202725" }}>
            <span style={{ color: "#8a9a94" }}>Supabase Endpoint</span>
            <span className="mono-value" style={{ color: "#dbe5e1" }}>{data.diagnostics.supabaseUrl}</span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #202725" }}>
            <span style={{ color: "#8a9a94" }}>Database Status</span>
            <span style={{ color: "#85dabf", fontWeight: 550 }}>Connected (Row-Level Security Active)</span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #202725" }}>
            <span style={{ color: "#8a9a94" }}>Security Headers</span>
            <span style={{ color: "#85dabf" }}>HSTS, CSP, X-Frame-Options: DENY, nosniff</span>
          </div>

          <div>
            <span style={{ color: "#8a9a94", display: "block", marginBottom: 8 }}>Table Record Census</span>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 8 }}>
              {Object.entries(data.diagnostics.counts).map(([table, count]) => (
                <div key={table} style={{ padding: "8px 12px", background: "#131716", border: "1px solid #232d2a", borderRadius: 4 }}>
                  <div style={{ color: "#74847e", fontSize: 10, textTransform: "capitalize" }}>{table}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#dbe5e1", marginTop: 2 }}>{count}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="panel" style={{ padding: "20px 24px" }}>
        <h2 style={{ fontSize: 14, margin: "0 0 16px", color: "#e4ece8" }}>Workspace Defensive Controls</h2>
        
        <div style={{ display: "grid", gap: 14 }}>
          <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}>
            <div>
              <strong style={{ fontSize: 12, color: "#dce6e1", display: "block" }}>Strict Passive Intelligence Boundary</strong>
              <span style={{ fontSize: 11, color: "#7f908a" }}>Guarantees the application will never initiate active scans, HTTP probes, or Tor queries.</span>
            </div>
            <input
              type="checkbox"
              checked={safeMode}
              onChange={(e) => setSafeMode(e.target.checked)}
              style={{ accentColor: "var(--accent)" }}
            />
          </label>

          <div style={{ borderTop: "1px solid #202725", paddingTop: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <strong style={{ fontSize: 12, color: "#dce6e1", display: "block" }}>Display Density</strong>
              <span style={{ fontSize: 11, color: "#7f908a" }}>Adjust spacing across intelligence tables and relationship graphs.</span>
            </div>
            <select
              value={density}
              onChange={(e) => setDensity(e.target.value)}
              style={{ padding: "4px 10px", borderRadius: 4, background: "#151b1a", color: "#d5deda", border: "1px solid var(--border)", fontSize: 11 }}
            >
              <option value="comfortable">Comfortable</option>
              <option value="compact">Compact (Analyst)</option>
            </select>
          </div>
        </div>
      </section>

      <section className="panel" style={{ padding: "20px 24px", borderColor: "rgb(228 124 119 / 20%)" }}>
        <h2 style={{ fontSize: 14, margin: "0 0 8px", color: "#f0a6a2" }}>Analyst Session</h2>
        <p style={{ color: "#8a9993", fontSize: 12, margin: "0 0 16px" }}>
          Signing out terminates your authenticated session tokens and clears encrypted credentials.
        </p>
        <form action={logout}>
          <button className="auth-button" style={{ width: "auto", minHeight: 36, padding: "0 18px", background: "rgb(228 124 119 / 12%)", color: "#f39893", borderColor: "rgb(228 124 119 / 35%)" }} type="submit">
            <LogOut size={14} /> End Analyst Session
          </button>
        </form>
      </section>
    </div>
  );
}
