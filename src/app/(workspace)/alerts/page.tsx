import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AlertsView, type AlertItem } from "@/components/alerts/alerts-view";

export const metadata: Metadata = { title: "Alerts Triage" };

export default async function AlertsPage() {
  const supabase = await createClient();
  if (!supabase) redirect("/login");

  const { data, error } = await supabase
    .from("alerts")
    .select(`
      id,
      type,
      severity,
      title,
      description,
      status,
      created_at,
      actor_id,
      actors ( canonical_name )
    `)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) console.error("Alerts query failed", error);

  type RawAlert = {
    id: string;
    type: string;
    severity: "critical" | "high" | "medium" | "low";
    title: string;
    description: string;
    status: "open" | "acknowledged" | "resolved";
    created_at: string;
    actor_id: string | null;
    actors: { canonical_name: string } | null;
  };

  const rawList = (data ?? []) as unknown as RawAlert[];
  const alerts: AlertItem[] = rawList.map((row) => ({
    id: row.id,
    type: row.type,
    severity: row.severity,
    title: row.title,
    description: row.description,
    status: row.status,
    created_at: row.created_at,
    actor_id: row.actor_id,
    actor_name: row.actors?.canonical_name,
  }));

  return (
    <main className="content">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Real-Time Threat Notifications</p>
          <h1>Alerts Triage</h1>
          <p className="page-description">Security events, candidate relationship discoveries, and critical infrastructure changes.</p>
        </div>
        <div className="period-label">
          <ShieldAlert size={13} aria-hidden="true" /> {alerts.length} total alerts
        </div>
      </div>

      <AlertsView alerts={alerts} />
    </main>
  );
}
