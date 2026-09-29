import type { Metadata } from "next";
import { notFound } from "next/navigation";

const sections: Record<string, { title: string; description: string }> = {
  actors: { title: "Actors", description: "Review synthetic and analyst-curated actor profiles." },
  search: { title: "Global search", description: "Search across actors, identifiers, observations and evidence." },
  graph: { title: "Graph analysis", description: "Explore candidate relationships and their supporting signals." },
  timeline: { title: "Timeline", description: "Review chronological observations and investigation events." },
  evidence: { title: "Evidence", description: "Inspect collected evidence and verify its integrity." },
  infrastructure: { title: "Infrastructure", description: "Review passive and authorized infrastructure intelligence." },
  investigations: { title: "Investigations", description: "Organize entities, evidence and analyst notes." },
  analysis: { title: "Analysis", description: "Run deterministic, explainable similarity analysis." },
  alerts: { title: "Alerts", description: "Review and triage intelligence alerts." },
  reports: { title: "Reports", description: "Prepare analyst-reviewed intelligence exports." },
  settings: { title: "Settings", description: "Manage account preferences and workspace configuration." },
};

type SectionParams = { params: Promise<{ section: string }> };

export async function generateMetadata({ params }: SectionParams): Promise<Metadata> {
  const { section } = await params;
  return { title: sections[section]?.title ?? "Workspace" };
}

export default async function SectionPage() {
  notFound();
}