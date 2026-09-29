import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Globe2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { InfrastructureView, type InfraRecord } from "@/components/infrastructure/infrastructure-view";

export const metadata: Metadata = { title: "Infrastructure Intelligence" };

export default async function InfrastructurePage() {
  const supabase = await createClient();
  if (!supabase) redirect("/login");

  const { data, error } = await supabase
    .from("infrastructure")
    .select(`
      id,
      type,
      value,
      normalized_value,
      provider,
      asn,
      country,
      confidence,
      first_seen,
      last_seen,
      actor_id,
      actors ( canonical_name )
    `)
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) console.error("Infrastructure query failed", error);

  type RawInfra = {
    id: string;
    type: string;
    value: string;
    normalized_value: string;
    provider: string | null;
    asn: string | null;
    country: string | null;
    confidence: string;
    first_seen: string | null;
    last_seen: string | null;
    actor_id: string | null;
    actors: { canonical_name: string } | null;
  };

  const rawList = (data ?? []) as unknown as RawInfra[];
  const records: InfraRecord[] = rawList.map((row) => ({
    id: row.id,
    type: row.type,
    value: row.value,
    normalized_value: row.normalized_value,
    provider: row.provider,
    asn: row.asn,
    country: row.country,
    confidence: row.confidence,
    first_seen: row.first_seen,
    last_seen: row.last_seen,
    actor_id: row.actor_id,
    actor_name: row.actors?.canonical_name,
  }));

  return (
    <main className="content">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Passive Network Topology</p>
          <h1>Infrastructure Intelligence</h1>
          <p className="page-description">Domains, IP blocks, certificates, and autonomous system telemetry correlating threat actors.</p>
        </div>
        <div className="period-label">
          <Globe2 size={13} aria-hidden="true" /> {records.length} passive indicators
        </div>
      </div>

      <InfrastructureView records={records} />
    </main>
  );
}
