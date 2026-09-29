import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Search } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { SearchView, type SearchEntity } from "@/components/search/search-view";

export const metadata: Metadata = { title: "Global Search" };

export default async function SearchPage() {
  const supabase = await createClient();
  if (!supabase) redirect("/login");

  const [actorsRes, identifiersRes, observationsRes, evidenceRes, infraRes] = await Promise.all([
    supabase.from("actors").select("id, canonical_name, category, description, status, confidence").limit(300),
    supabase.from("identifiers").select("id, actor_id, type, value, normalized_value").limit(300),
    supabase.from("observations").select("id, title, content, observation_type, observed_at, actor_id").limit(300),
    supabase.from("evidence").select("id, description, content, evidence_type, content_hash").limit(300),
    supabase.from("infrastructure").select("id, type, value, provider, country, asn").limit(300),
  ]);

  const entities: SearchEntity[] = [];

  for (const a of actorsRes.data ?? []) {
    entities.push({
      id: a.id,
      type: "actor",
      title: a.canonical_name,
      subtitle: `Category: ${a.category} · Status: ${a.status}`,
      snippet: a.description || "No description recorded.",
      badge: a.confidence ? `${a.confidence} confidence` : undefined,
      href: `/graph?focus=${a.id}`,
    });
  }

  for (const idf of identifiersRes.data ?? []) {
    entities.push({
      id: idf.id,
      type: "identifier",
      title: idf.value,
      subtitle: `Identifier type: ${idf.type}`,
      snippet: `Normalized: ${idf.normalized_value}`,
      href: `/actors`,
    });
  }

  for (const obs of observationsRes.data ?? []) {
    entities.push({
      id: obs.id,
      type: "observation",
      title: obs.title,
      subtitle: `${obs.observation_type.replace(/_/g, " ")} · ${obs.observed_at ? new Date(obs.observed_at).toLocaleDateString() : "Recent"}`,
      snippet: obs.content,
      href: `/timeline`,
    });
  }

  for (const ev of evidenceRes.data ?? []) {
    entities.push({
      id: ev.id,
      type: "evidence",
      title: ev.description || "Evidence Artifact",
      subtitle: `Type: ${ev.evidence_type} · SHA-256: ${ev.content_hash.slice(0, 16)}…`,
      snippet: ev.content,
      href: `/evidence`,
    });
  }

  for (const inf of infraRes.data ?? []) {
    entities.push({
      id: inf.id,
      type: "infrastructure",
      title: inf.value,
      subtitle: `Type: ${inf.type} · Provider: ${inf.provider || "Unknown"}`,
      snippet: `Country: ${inf.country || "N/A"} · ASN: ${inf.asn || "N/A"}`,
      href: `/infrastructure`,
    });
  }

  return (
    <main className="content">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Intelligence Discovery</p>
          <h1>Global Search</h1>
          <p className="page-description">Search and correlate across actors, identifiers, observations, evidence, and infrastructure.</p>
        </div>
        <div className="period-label">
          <Search size={13} aria-hidden="true" /> {entities.length} indexed entities
        </div>
      </div>

      <SearchView initialEntities={entities} />
    </main>
  );
}
