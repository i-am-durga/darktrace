import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Settings2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { SettingsView, type SettingsData } from "@/components/settings/settings-view";
import { getSupabaseConfig } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "Settings & System Diagnostics" };

export default async function SettingsPage() {
  const supabase = await createClient();
  if (!supabase) redirect("/login");

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const [actorsC, sourcesC, obsC, evC, infraC, alertsC, invC] = await Promise.all([
    supabase.from("actors").select("id", { count: "exact", head: true }),
    supabase.from("sources").select("id", { count: "exact", head: true }),
    supabase.from("observations").select("id", { count: "exact", head: true }),
    supabase.from("evidence").select("id", { count: "exact", head: true }),
    supabase.from("infrastructure").select("id", { count: "exact", head: true }),
    supabase.from("alerts").select("id", { count: "exact", head: true }),
    supabase.from("investigations").select("id", { count: "exact", head: true }),
  ]);

  const config = getSupabaseConfig();
  const endpoint = config ? new URL(config.url).hostname : "unconfigured";

  const settingsData: SettingsData = {
    user: {
      id: user.id,
      email: user.email || "analyst@darktrace.internal",
      role: profile?.role || "analyst",
      createdAt: user.created_at || new Date().toISOString(),
    },
    diagnostics: {
      supabaseUrl: endpoint,
      dbConnected: true,
      counts: {
        actors: actorsC.count ?? 0,
        sources: sourcesC.count ?? 0,
        observations: obsC.count ?? 0,
        evidence: evC.count ?? 0,
        infrastructure: infraC.count ?? 0,
        alerts: alertsC.count ?? 0,
        investigations: invC.count ?? 0,
      },
    },
  };

  return (
    <main className="content">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Workspace Configuration</p>
          <h1>Settings & System Diagnostics</h1>
          <p className="page-description">Analyst profile, Supabase health checks, defensive policies, and platform preferences.</p>
        </div>
        <div className="period-label">
          <Settings2 size={13} aria-hidden="true" /> System diagnostics
        </div>
      </div>

      <SettingsView data={settingsData} />
    </main>
  );
}
