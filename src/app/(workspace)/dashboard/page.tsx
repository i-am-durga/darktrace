import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  Activity, AlertTriangle, ArrowUpRight, Fingerprint, GitBranch,
  Globe2, Radio, Users,
} from "lucide-react";
import { DashboardCharts } from "@/components/dashboard/dashboard-charts";
import { getDashboardOverview } from "@/lib/dashboard/overview";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Dashboard" };

const metrics = [
  { key: "actors", label: "Total actors", icon: Users },
  { key: "activeActors", label: "Active actors", icon: Radio },
  { key: "identifiers", label: "Identifiers", icon: Fingerprint },
  { key: "relationships", label: "Relationships", icon: GitBranch },
  { key: "evidence", label: "Evidence items", icon: Activity },
  { key: "infrastructure", label: "Infrastructure", icon: Globe2 },
  { key: "openAlerts", label: "Open alerts", icon: AlertTriangle },
  { key: "investigations", label: "Active investigations", icon: ArrowUpRight },
] as const;

export default async function DashboardPage() {
  const supabase = await createClient();
  if (!supabase) redirect("/login");

  const overview = await getDashboardOverview(supabase);
  const connected = overview.status === "ready";

  return (
    <main className="content">
      <div className="page-heading">
        <div><p className="eyebrow">Intelligence overview</p><h1>Dashboard</h1><p className="page-description">A current view of monitored entities and analyst activity.</p></div>
        <div className="period-label"><Activity size={13} aria-hidden="true" /> Last 30 days</div>
      </div>

      {!connected && (
        <section className="setup-notice" aria-label="Database setup status">
          <AlertTriangle size={16} aria-hidden="true" />
          <div><strong>Intelligence data could not be loaded</strong><p>Check that the DarkTrace migration is applied to this Supabase project and that the signed-in user can read the intelligence tables. No sample statistics are shown as live data.</p></div>
        </section>
      )}

      <section className="stats-grid" aria-label="Intelligence statistics">
        {metrics.map(({ key, label, icon: Icon }) => (
          <article className="stat-panel" key={label}>
            <div className="stat-topline"><span>{label}</span><Icon className="stat-icon" size={15} aria-hidden="true" /></div>
            <div className="stat-value" aria-label={`${label}: ${connected ? overview.stats[key] : "unavailable"}`}>
              {connected ? overview.stats[key].toLocaleString() : "—"}
            </div>
          </article>
        ))}
      </section>

      {connected ? (
        <DashboardCharts observationActivity={overview.observationActivity} actorCategories={overview.actorCategories} />
      ) : (
        <div className="charts-grid">
          <section className="panel"><div className="panel-header"><h2 className="panel-title">Observations over time</h2></div><div className="chart-wrap"><p className="chart-empty-label">Waiting for database access</p></div></section>
          <section className="panel"><div className="panel-header"><h2 className="panel-title">Actors by category</h2></div><div className="chart-wrap"><p className="chart-empty-label">Waiting for database access</p></div></section>
        </div>
      )}

      <section className="panel activity-panel" aria-labelledby="activity-title">
        <div className="panel-header"><h2 className="panel-title" id="activity-title">Recent activity</h2><span className="panel-meta">Latest observations</span></div>
        {!connected || overview.recentActivity.length === 0 ? (
          <div className="activity-empty"><Activity size={18} aria-hidden="true" /><p>{connected ? "No observations have been recorded yet." : "Recent observations will appear after database access is available."}</p></div>
        ) : (
          <div className="activity-list">
            {overview.recentActivity.map((event) => (
              <article className="activity-row" key={event.id}>
                <span className="activity-marker" aria-hidden="true" />
                <div className="activity-detail"><strong>{event.title}</strong><span>{event.observation_type.replaceAll("_", " ")}</span></div>
                <time dateTime={event.observed_at}>{new Date(event.observed_at).toLocaleString()}</time>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}