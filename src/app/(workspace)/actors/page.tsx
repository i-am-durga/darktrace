import type { Metadata } from "next";
import { AlertTriangle, Users } from "lucide-react";
import { redirect } from "next/navigation";
import { ActorDirectory } from "@/components/actors/actor-directory";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Actors" };

export default async function ActorsPage() {
  const supabase = await createClient();
  if (!supabase) redirect("/login");

  const { data, error } = await supabase
    .from("actors")
    .select("id, canonical_name, category, status, confidence, first_seen, last_seen")
    .order("canonical_name")
    .limit(1000);

  if (error) console.error("Actor directory query failed", { code: error.code });

  return (
    <main className="content">
      <div className="page-heading">
        <div><p className="eyebrow">Entity registry</p><h1>Actors</h1><p className="page-description">Fictional and analyst-curated entities with reviewable candidate links.</p></div>
        <div className="period-label"><Users size={13} aria-hidden="true" /> {error ? "Data unavailable" : `${data?.length ?? 0} records`}</div>
      </div>
      {error ? (
        <section className="setup-notice" role="status">
          <AlertTriangle size={16} aria-hidden="true" />
          <div><strong>Actor data could not be loaded</strong><p>Apply the DarkTrace schema migration to this Supabase project and confirm authenticated users can read the actors table.</p></div>
        </section>
      ) : data && data.length > 0 ? (
        <section className="panel actor-directory-panel" aria-label="Actor records">
          <ActorDirectory actors={data} />
        </section>
      ) : (
        <section className="phase-empty"><div><Users size={21} aria-hidden="true" /><h2>No actor records yet</h2><p>Run the synthetic seed SQL after applying the schema migration to populate the training dataset.</p></div></section>
      )}
    </main>
  );
}
