import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { FolderKanban } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { InvestigationsView, type InvestigationItem } from "@/components/investigations/investigations-view";

export const metadata: Metadata = { title: "Investigations Desk" };

export default async function InvestigationsPage() {
  const supabase = await createClient();
  if (!supabase) redirect("/login");

  const [invRes, entRes] = await Promise.all([
    supabase
      .from("investigations")
      .select("id, name, description, status, created_at, updated_at")
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("investigation_entities")
      .select("investigation_id")
      .limit(1000),
  ]);

  if (invRes.error) console.error("Investigations query failed", invRes.error);

  const entityCounts = new Map<string, number>();
  for (const ent of entRes.data ?? []) {
    entityCounts.set(ent.investigation_id, (entityCounts.get(ent.investigation_id) ?? 0) + 1);
  }

  const cases: InvestigationItem[] = (invRes.data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    status: row.status as InvestigationItem["status"],
    created_at: row.created_at,
    updated_at: row.updated_at,
    entity_count: entityCounts.get(row.id) ?? 0,
  }));

  return (
    <main className="content">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Case Management & Hypotheses</p>
          <h1>Investigations Desk</h1>
          <p className="page-description">Organize evidence, pin suspect personas, and conduct structured defensive inquiries.</p>
        </div>
        <div className="period-label">
          <FolderKanban size={13} aria-hidden="true" /> {cases.length} active investigations
        </div>
      </div>

      <InvestigationsView cases={cases} />
    </main>
  );
}
