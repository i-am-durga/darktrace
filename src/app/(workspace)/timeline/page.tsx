import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Clock3 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { TimelineView, type TimelineEvent } from "@/components/timeline/timeline-view";
import { QUERY_LIMIT_TIMELINE } from "@/lib/constants";

export const metadata: Metadata = { title: "Timeline Analysis" };

export default async function TimelinePage() {
  const supabase = await createClient();
  if (!supabase) redirect("/login");

  const { data, error } = await supabase
    .from("observations")
    .select(`
      id,
      title,
      content,
      content_hash,
      observation_type,
      observed_at,
      actor_id,
      actors ( canonical_name ),
      sources ( name )
    `)
    .order("observed_at", { ascending: false })
    .limit(QUERY_LIMIT_TIMELINE);

  if (error) console.error("Timeline query failed", error);

  type RawObs = {
    id: string;
    title: string;
    content: string;
    content_hash: string;
    observation_type: string;
    observed_at: string;
    actor_id: string | null;
    actors: { canonical_name: string } | null;
    sources: { name: string } | null;
  };

  const rawList = (data ?? []) as unknown as RawObs[];
  const events: TimelineEvent[] = rawList.map((row) => ({
    id: row.id,
    title: row.title,
    content: row.content,
    content_hash: row.content_hash,
    observation_type: row.observation_type,
    observed_at: row.observed_at,
    actor_id: row.actor_id ?? undefined,
    actor_name: row.actors?.canonical_name,
    source_name: row.sources?.name,
  }));

  return (
    <main className="content">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Chronological Intelligence</p>
          <h1>Timeline</h1>
          <p className="page-description">Chronological reconstruction of observations, forum activities, and infrastructure shifts.</p>
        </div>
        <div className="period-label">
          <Clock3 size={13} aria-hidden="true" /> {events.length} chronological events
        </div>
      </div>

      <TimelineView events={events} />
    </main>
  );
}
