import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ChartNoAxesCombined } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AnalysisView, type AnalysisItem } from "@/components/analysis/analysis-view";

export const metadata: Metadata = { title: "Similarity & Correlation Analysis" };

export default async function AnalysisPage() {
  const supabase = await createClient();
  if (!supabase) redirect("/login");

  const { data, error } = await supabase
    .from("analysis_results")
    .select(`
      id,
      analysis_type,
      score,
      confidence,
      signals,
      summary,
      created_at,
      actor_id,
      actors ( canonical_name )
    `)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) console.error("Analysis results query failed", error);

  type RawAnalysis = {
    id: string;
    analysis_type: string;
    score: number | null;
    confidence: string;
    signals: unknown;
    summary: string;
    created_at: string;
    actor_id: string | null;
    actors: { canonical_name: string } | null;
  };

  const rawList = (data ?? []) as unknown as RawAnalysis[];
  const analyses: AnalysisItem[] = rawList.map((row) => ({
    id: row.id,
    analysis_type: row.analysis_type,
    score: typeof row.score === "number" ? row.score : Number(row.score) || 0,
    confidence: row.confidence,
    signals: Array.isArray(row.signals) ? (row.signals as string[]) : [],
    summary: row.summary,
    created_at: row.created_at,
    actor_id: row.actor_id ?? undefined,
    actor_name: row.actors?.canonical_name,
  }));

  return (
    <main className="content">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Explainable Threat Correlation</p>
          <h1>Correlation & Similarity Analysis</h1>
          <p className="page-description">Deterministic multi-signal evaluations comparing personas, infrastructure, and behavior.</p>
        </div>
        <div className="period-label">
          <ChartNoAxesCombined size={13} aria-hidden="true" /> {analyses.length} model evaluations
        </div>
      </div>

      <AnalysisView analyses={analyses} />
    </main>
  );
}
