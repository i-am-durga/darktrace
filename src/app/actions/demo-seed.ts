"use server";

import fs from "node:fs";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { parseIngestionFile } from "@/lib/ingestion/parse";
import { createClient } from "@/lib/supabase/server";
import { runIntelligenceAnalysis } from "@/lib/intelligence/analyzer";
import { createHash } from "node:crypto";

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
    if (!fs.existsSync(samplePath)) {
      return { message: "Sample file not found on disk.", error: true };
    }

    const csvContent = fs.readFileSync(samplePath, "utf8");
    const parsed = parseIngestionFile("authorized_threat_intel_sample.csv", csvContent);
    if (!parsed.success) {
      return { message: parsed.message, error: true };
    }

    let actorsCreated = 0;
    let obsCreated = 0;
    let evidenceCreated = 0;

    // 1. Ingest Actors
    for (const actor of parsed.data.actors) {
      const { data: existing } = await supabase
        .from("actors")
        .select("id")
        .ilike("canonical_name", actor.canonical_name)
        .limit(1)
        .maybeSingle();

      if (!existing) {
        const { error: aErr } = await supabase.from("actors").insert({
          canonical_name: actor.canonical_name,
          category: actor.category,
          description: actor.description,
          status: actor.status,
          confidence: actor.confidence,
        });
        if (!aErr) actorsCreated++;
      }
    }

    // 2. Ingest Observations, Sources & Evidence
    for (const obs of parsed.data.observations) {
      // Source
      let sourceId: string | null = null;
      const { data: sMatch } = await supabase
        .from("sources")
        .select("id")
        .eq("name", obs.source.name)
        .eq("type", obs.source.type)
        .limit(1)
        .maybeSingle();

      if (sMatch?.id) {
        sourceId = sMatch.id;
      } else {
        const { data: newSrc } = await supabase
          .from("sources")
          .insert({
            name: obs.source.name,
            type: obs.source.type,
            url: obs.source.url,
            trust_level: obs.source.trust_level,
          })
          .select("id")
          .maybeSingle();
        sourceId = newSrc?.id ?? null;
      }

      // Actor
      let actorId: string | null = null;
      if (obs.actor_name) {
        const { data: aMatch } = await supabase
          .from("actors")
          .select("id")
          .ilike("canonical_name", obs.actor_name)
          .limit(1)
          .maybeSingle();
        actorId = aMatch?.id ?? null;
      }

      // Content Hash & Deduplication
      const contentHash = createHash("sha256").update(obs.content, "utf8").digest("hex");
      const { data: existingObs } = await supabase
        .from("observations")
        .select("id")
        .eq("title", obs.title)
        .eq("content_hash", contentHash)
        .limit(1)
        .maybeSingle();

      if (existingObs) continue;

      const { data: newObs } = await supabase
        .from("observations")
        .insert({
          actor_id: actorId,
          source_id: sourceId,
          title: obs.title,
          content: obs.content,
          content_hash: contentHash,
          observation_type: obs.observation_type,
          observed_at: obs.observed_at || new Date().toISOString(),
          metadata: {
            ingestion_method: "one_click_demo_loader",
            original_filename: "authorized_threat_intel_sample.csv",
          },
        })
        .select("id")
        .maybeSingle();

      if (newObs?.id) {
        obsCreated++;
        const { error: eErr } = await supabase.from("evidence").insert({
          observation_id: newObs.id,
          evidence_type: "text",
          description: `Imported from sample dataset`,
          content: obs.content,
          content_hash: contentHash,
          captured_at: obs.observed_at || new Date().toISOString(),
          source_url: obs.source.url,
          metadata: {
            ingestion_method: "one_click_demo_loader",
            source_name: obs.source.name,
          },
        });
        if (!eErr) evidenceCreated++;
      }
    }

    // 3. Immediately trigger multi-signal intelligence analysis
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
        actors: actorsCreated,
        observations: obsCreated,
        evidence: evidenceCreated,
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
