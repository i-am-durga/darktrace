import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Activity } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ReportsView, type ReportData } from "@/components/reports/reports-view";

export const metadata: Metadata = { title: "Intelligence Reports" };

export default async function ReportsPage() {
  const supabase = await createClient();
  if (!supabase) redirect("/login");

  const [actorsRes, obsRes, evRes, infraRes, alertsRes] = await Promise.all([
    supabase.from("actors").select("id, canonical_name, category, status, confidence").limit(100),
    supabase.from("observations").select("title, observation_type, observed_at").order("observed_at", { ascending: false }).limit(6),
    supabase.from("evidence").select("id", { count: "exact", head: true }),
    supabase.from("infrastructure").select("value, type, provider").limit(50),
    supabase.from("alerts").select("id", { count: "exact", head: true }),
  ]);

  const actors = actorsRes.data ?? [];
  const activeCount = actors.filter((a) => a.status === "active").length;

  const report: ReportData = {
    totalActors: actors.length,
    activeActors: activeCount,
    totalObservations: (obsRes.data ?? []).length,
    totalEvidence: evRes.count ?? 0,
    totalInfra: (infraRes.data ?? []).length,
    totalAlerts: alertsRes.count ?? 0,
    recentObservations: (obsRes.data ?? []).map((o) => ({
      title: o.title,
      type: o.observation_type,
      date: new Date(o.observed_at).toLocaleDateString(),
    })),
    topActors: actors.slice(0, 10).map((a) => ({
      name: a.canonical_name,
      category: a.category,
      status: a.status,
      confidence: a.confidence,
    })),
    infraHighlights: (infraRes.data ?? []).slice(0, 10).map((i) => ({
      value: i.value,
      type: i.type,
      provider: i.provider,
    })),
  };

  return (
    <main className="content">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Dossier & Executive Intelligence</p>
          <h1>Intelligence Reports</h1>
          <p className="page-description">Generate printable executive briefings, actor dossiers, and compliance audit exports.</p>
        </div>
        <div className="period-label">
          <Activity size={13} aria-hidden="true" /> Live data snapshot
        </div>
      </div>

      <ReportsView report={report} />
    </main>
  );
}
