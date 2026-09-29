import type { Metadata } from "next";
import { AlertTriangle, GitBranch } from "lucide-react";
import { redirect } from "next/navigation";
import { GraphViewer } from "@/components/graph/graph-viewer";
import { getGraphData } from "@/lib/intelligence/graph";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Graph analysis" };

type GraphPageProps = { searchParams: Promise<{ focus?: string }> };

export default async function GraphPage({ searchParams }: GraphPageProps) {
  const supabase = await createClient();
  if (!supabase) redirect("/login");

  const [{ focus }, graph] = await Promise.all([searchParams, getGraphData(supabase)]);

  return (
    <main className="content graph-content">
      <div className="page-heading">
        <div><p className="eyebrow">Relationship analysis</p><h1>Graph analysis</h1><p className="page-description">Explore evidence-backed candidate correlations across synthetic entities.</p></div>
        <div className="period-label"><GitBranch size={13} aria-hidden="true" /> {graph.status === "ready" ? `${graph.nodes.length} nodes · ${graph.edges.length} links` : "Data unavailable"}</div>
      </div>
      {graph.status === "error" ? (
        <section className="setup-notice" role="status">
          <AlertTriangle size={16} aria-hidden="true" />
          <div><strong>Graph data could not be loaded</strong><p>Apply the DarkTrace schema migration and seed SQL to this Supabase project, then reload the graph.</p></div>
        </section>
      ) : graph.nodes.length === 0 ? (
        <section className="phase-empty"><div><GitBranch size={21} aria-hidden="true" /><h2>No graph records yet</h2><p>Run the fictional seed SQL after applying the migration. Candidate links are hypotheses for analyst review, not proof of identity.</p></div></section>
      ) : (
        <GraphViewer nodes={graph.nodes} edges={graph.edges} focusId={focus} />
      )}
    </main>
  );
}
