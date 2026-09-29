"use server";

import { promises as fs } from "node:fs";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { parseIngestionFile } from "@/lib/ingestion/parse";
import { ingestParsedPayload } from "@/lib/ingestion/ingest";
import { createClient } from "@/lib/supabase/server";
import { runIntelligenceAnalysis } from "@/lib/intelligence/analyzer";

export type DemoSeedState = {
  message?: string;
  error?: boolean;
  counts?: {
    actors: number;
    observations: number;
    evidence: number;
  };
};

export async function loadDemoSampleData(): Promise<DemoSeedState> {
  const supabase = await createClient();
  if (!supabase) return { message: "Supabase connection is not available.", error: true };

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { message: "You must be signed in to load demo intelligence records.", error: true };
  }

  try {
    const samplePath = path.resolve(process.cwd(), "public/samples/authorized_threat_intel_sample.csv");

    let csvContent: string;
    try {
      csvContent = await fs.readFile(samplePath, "utf8");
    } catch {
      return { message: "Sample file not found on disk.", error: true };
    }

    const parsed = parseIngestionFile("authorized_threat_intel_sample.csv", csvContent);
    if (!parsed.success) {
      return { message: parsed.message, error: true };
    }

    const result = await ingestParsedPayload(supabase, parsed.data, {
      sourceFilename: "authorized_threat_intel_sample.csv",
      ingestionMethod: "one_click_demo_loader",
      analystId: user.id,
    });

    // Trigger multi-signal intelligence analysis
    await runIntelligenceAnalysis(supabase);

    revalidatePath("/dashboard");
    revalidatePath("/actors");
    revalidatePath("/graph");
    revalidatePath("/analysis");
    revalidatePath("/alerts");
    revalidatePath("/evidence");
    revalidatePath("/timeline");
    revalidatePath("/reports");

    return {
      message: "Sample intelligence dataset loaded and analyzed successfully!",
      error: false,
      counts: {
        actors: result.actorsCreated,
        observations: result.observationsCreated,
        evidence: result.evidenceCreated,
      },
    };
  } catch (err: unknown) {
    console.error("Demo seed error", err);
    return {
      message: err instanceof Error ? err.message : "Failed to load sample intelligence records.",
      error: true,
    };
  }
}
