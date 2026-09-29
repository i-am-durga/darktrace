import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { IngestionForm } from "@/components/ingestion/ingestion-form";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Authorized ingestion" };

export default async function IngestionPage() {
  const supabase = await createClient();
  if (!supabase) redirect("/login");

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect("/login");

  return (
    <main className="content">
      <div className="page-heading">
        <div><p className="eyebrow">Analyst workflow</p><h1>Authorized ingestion</h1><p className="page-description">Import permitted CSV or JSON records into the intelligence workspace.</p></div>
        <span className="period-label">Signed in as analyst</span>
      </div>
      <IngestionForm />
    </main>
  );
}