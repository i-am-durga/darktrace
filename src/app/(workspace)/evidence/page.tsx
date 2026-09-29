import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { FileCheck2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { EvidenceView, type EvidenceItem } from "@/components/evidence/evidence-view";
import { QUERY_LIMIT_EVIDENCE } from "@/lib/constants";

export const metadata: Metadata = { title: "Evidence Vault" };

export default async function EvidencePage() {
  const supabase = await createClient();
  if (!supabase) redirect("/login");

  const { data, error } = await supabase
    .from("evidence")
    .select(`
      id,
      evidence_type,
      description,
      content,
      content_hash,
      captured_at,
      source_url,
      metadata,
      observations ( title )
    `)
    .order("captured_at", { ascending: false })
    .limit(QUERY_LIMIT_EVIDENCE);

  if (error) console.error("Evidence query failed", error);

  type RawEv = {
    id: string;
    evidence_type: string;
    description: string;
    content: string;
    content_hash: string;
    captured_at: string;
    source_url: string | null;
    metadata: Record<string, unknown> | null;
    observations: { title: string } | null;
  };

  const rawList = (data ?? []) as unknown as RawEv[];
  const items: EvidenceItem[] = rawList.map((row) => ({
    id: row.id,
    evidence_type: row.evidence_type,
    description: row.description,
    content: row.content,
    content_hash: row.content_hash,
    captured_at: row.captured_at,
    source_url: row.source_url,
    metadata: row.metadata,
    observation_title: row.observations?.title,
  }));

  return (
    <main className="content">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Defensive Chain of Custody</p>
          <h1>Evidence Vault</h1>
          <p className="page-description">Cryptographically verified intelligence artifacts with SHA-256 integrity digests.</p>
        </div>
        <div className="period-label">
          <FileCheck2 size={13} aria-hidden="true" /> {items.length} verified artifacts
        </div>
      </div>

      <EvidenceView items={items} />
    </main>
  );
}
