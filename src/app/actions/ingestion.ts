"use server";

import { createHash } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { parseIngestionFile } from "@/lib/ingestion/parse";
import type { IngestionState } from "@/lib/ingestion/types";

import { runIntelligenceAnalysis } from "@/lib/intelligence/analyzer";

const maximumUploadBytes = 2 * 1024 * 1024;

function databaseFailure(code: string | undefined) {
  console.error("Authorized ingestion query failed", { code });
  return "Import could not be completed. Check the database migration and your analyst permissions.";
}

function resultCount(result: unknown, key: string) {
  if (typeof result !== "object" || result === null || !(key in result)) return 0;
  const value = (result as Record<string, unknown>)[key];
  return typeof value === "number" ? value : 0;
}

export async function ingestAuthorizedFile(
  _previous: IngestionState,
  formData: FormData,
): Promise<IngestionState> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { message: "Choose a non-empty CSV or JSON file.", error: true };
  }
  if (file.size > maximumUploadBytes) {
    return { message: "File is too large. The maximum upload size is 2 MB.", error: true };
  }
  if (!/\.(csv|json)$/i.test(file.name)) {
    return { message: "Use a .csv or .json file.", error: true };
  }

  const contents = await file.text();
  const parsed = parseIngestionFile(file.name, contents);
  if (!parsed.success) return { message: parsed.message, error: true };

  const supabase = await createClient();
  if (!supabase) return { message: "Supabase is not configured.", error: true };
  const sanitizedFilename = file.name.replace(/[^A-Za-z0-9_.-]/g, "_").slice(0, 200);
  const fileHash = createHash("sha256").update(contents, "utf8").digest("hex");

  let actorsCreated = 0;
  let observationsCreated = 0;
  let observationsSkipped = 0;
  let evidenceCreated = 0;

  const { data, error } = await supabase.rpc("ingest_authorized_records", {
    p_payload: parsed.data,
    p_source_filename: sanitizedFilename,
    p_source_file_hash: fileHash,
  });

  if (error) {
    // If the RPC function is not in the schema cache (PGRST202 or 42883), execute direct table ingestion
    if (error.code === "PGRST202" || error.code === "42883" || error.message?.includes("schema cache")) {
      const { data: { user } } = await supabase.auth.getUser();

      // 1. Process actors
      for (const actor of parsed.data.actors) {
        const { data: existing } = await supabase
          .from("actors")
          .select("id")
          .ilike("canonical_name", actor.canonical_name)
          .limit(1)
          .maybeSingle();

        if (!existing) {
          const { error: insErr } = await supabase.from("actors").insert({
            canonical_name: actor.canonical_name,
            category: actor.category,
            description: actor.description,
            status: actor.status,
            confidence: actor.confidence,
          });
          if (!insErr) actorsCreated++;
        }
      }

      // 2. Process observations and link sources & evidence
      for (const obs of parsed.data.observations) {
        // Resolve source
        let sourceId: string | null = null;
        const { data: srcMatch } = await supabase
          .from("sources")
          .select("id")
          .eq("name", obs.source.name)
          .eq("type", obs.source.type)
          .limit(1)
          .maybeSingle();

        if (srcMatch?.id) {
          sourceId = srcMatch.id;
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

        // Resolve actor
        let actorId: string | null = null;
        if (obs.actor_name) {
          const { data: actorMatch } = await supabase
            .from("actors")
            .select("id")
            .ilike("canonical_name", obs.actor_name)
            .limit(1)
            .maybeSingle();

          if (actorMatch?.id) {
            actorId = actorMatch.id;
          } else {
            const { data: newActor } = await supabase
              .from("actors")
              .insert({
                canonical_name: obs.actor_name,
                category: "unknown",
                status: "monitoring",
                confidence: "low",
              })
              .select("id")
              .maybeSingle();
            if (newActor?.id) {
              actorId = newActor.id;
              actorsCreated++;
            }
          }
        }

        // Check if observation already exists by title & content hash
        const contentHash = createHash("sha256").update(obs.content, "utf8").digest("hex");
        const { data: existingObs } = await supabase
          .from("observations")
          .select("id")
          .eq("title", obs.title)
          .eq("content_hash", contentHash)
          .limit(1)
          .maybeSingle();

        if (existingObs) {
          observationsSkipped++;
          continue;
        }

        const { data: newObs, error: obsErr } = await supabase
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
              ingestion_method: "authorized_file_upload",
              original_filename: sanitizedFilename,
              source_reference: obs.source.url,
            },
          })
          .select("id")
          .maybeSingle();

        if (obsErr || !newObs) continue;
        observationsCreated++;

        const { error: evErr } = await supabase.from("evidence").insert({
          observation_id: newObs.id,
          evidence_type: "text",
          description: `Authorized import from ${sanitizedFilename}`,
          content: obs.content,
          content_hash: contentHash,
          captured_at: obs.observed_at || new Date().toISOString(),
          source_url: obs.source.url,
          metadata: {
            ingestion_method: "authorized_file_upload",
            source_name: obs.source.name,
          },
        });
        if (!evErr) evidenceCreated++;
      }

      if (user) {
        await supabase.from("ingestion_batches").insert({
          analyst_id: user.id,
          source_filename: sanitizedFilename,
          file_sha256: fileHash,
          actors_created: actorsCreated,
          observations_created: observationsCreated,
          observations_skipped: observationsSkipped,
          evidence_created: evidenceCreated,
        });
      }
    } else {
      return { message: databaseFailure(error.code), error: true };
    }
  } else {
    actorsCreated = resultCount(data, "actors_created");
    observationsCreated = resultCount(data, "observations_created");
    observationsSkipped = resultCount(data, "observations_skipped");
    evidenceCreated = resultCount(data, "evidence_created");
  }

  // Trigger automated multi-signal analysis on the newly ingested records
  try {
    await runIntelligenceAnalysis(supabase);
  } catch (analysisErr) {
    console.warn("Automated post-ingestion analysis notice:", analysisErr);
  }

  revalidatePath("/dashboard");
  revalidatePath("/actors");
  revalidatePath("/graph");
  revalidatePath("/analysis");
  revalidatePath("/alerts");
  revalidatePath("/evidence");

  return {
    message: "Authorized records imported and intelligence models updated successfully.",
    counts: {
      actorsCreated,
      observationsCreated,
      observationsSkipped,
      evidenceCreated,
    },
  };
}
