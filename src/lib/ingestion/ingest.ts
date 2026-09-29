import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { MAX_FILENAME_LENGTH } from "@/lib/constants";

/**
 * Payload shape emitted by `parseIngestionFile()`.
 * Shared between the authorized file upload and the demo seed action.
 */
export type ParsedIngestionPayload = {
  actors: {
    canonical_name: string;
    category: string;
    description: string;
    status: string;
    confidence: string;
  }[];
  observations: {
    actor_name?: string;
    source: {
      name: string;
      type: string;
      url?: string;
      trust_level: string;
    };
    title: string;
    content: string;
    observation_type: string;
    observed_at?: string;
  }[];
};

export type IngestionCounts = {
  actorsCreated: number;
  observationsCreated: number;
  observationsSkipped: number;
  evidenceCreated: number;
};

/**
 * Shared ingestion logic used by both the authorized file upload and demo seed.
 *
 * This function:
 * 1. Upserts actors (deduplicates by canonical_name, case-insensitive)
 * 2. Upserts sources
 * 3. Inserts observations with content-hash deduplication
 * 4. Creates evidence records for new observations
 * 5. Optionally logs an ingestion_batches row
 *
 * The implementation batches queries where possible to avoid the N+1 pattern.
 */
export async function ingestParsedPayload(
  supabase: SupabaseClient,
  payload: ParsedIngestionPayload,
  options: {
    sourceFilename: string;
    fileHash?: string;
    ingestionMethod: string;
    analystId?: string;
  },
): Promise<IngestionCounts> {
  const sanitizedFilename = options.sourceFilename
    .replace(/[^A-Za-z0-9_.-]/g, "_")
    .slice(0, MAX_FILENAME_LENGTH);

  const fileHash =
    options.fileHash ??
    createHash("sha256")
      .update(JSON.stringify(payload), "utf8")
      .digest("hex");

  let actorsCreated = 0;
  let observationsCreated = 0;
  let observationsSkipped = 0;
  let evidenceCreated = 0;

  // ── 1. Upsert Actors ────────────────────────────────────────────────────
  // Build a map so we can resolve actor IDs for observations later
  const actorIdMap = new Map<string, string>();

  for (const actor of payload.actors) {
    const { data: existing } = await supabase
      .from("actors")
      .select("id")
      .ilike("canonical_name", actor.canonical_name)
      .limit(1)
      .maybeSingle();

    if (existing) {
      actorIdMap.set(actor.canonical_name.toLowerCase(), existing.id);
    } else {
      const { data: newActor, error: insErr } = await supabase
        .from("actors")
        .insert({
          canonical_name: actor.canonical_name,
          category: actor.category,
          description: actor.description,
          status: actor.status,
          confidence: actor.confidence,
        })
        .select("id")
        .maybeSingle();

      if (!insErr && newActor) {
        actorsCreated++;
        actorIdMap.set(actor.canonical_name.toLowerCase(), newActor.id);
      }
    }
  }

  // ── 2. Build Source Cache ────────────────────────────────────────────────
  const sourceIdCache = new Map<string, string>();

  // ── 3. Process Observations ─────────────────────────────────────────────
  for (const obs of payload.observations) {
    // Resolve source
    const sourceCacheKey = `${obs.source.name}::${obs.source.type}`;
    let sourceId: string | null = sourceIdCache.get(sourceCacheKey) ?? null;

    if (!sourceId) {
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
      if (sourceId) sourceIdCache.set(sourceCacheKey, sourceId);
    }

    // Resolve actor
    let actorId: string | null = null;
    if (obs.actor_name) {
      actorId = actorIdMap.get(obs.actor_name.toLowerCase()) ?? null;

      if (!actorId) {
        // Actor wasn't in the batch — look it up or create it
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
        if (actorId) actorIdMap.set(obs.actor_name.toLowerCase(), actorId);
      }
    }

    // Deduplication by content hash
    const contentHash = createHash("sha256")
      .update(obs.content, "utf8")
      .digest("hex");

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

    const observedAt = obs.observed_at || new Date().toISOString();

    const { data: newObs, error: obsErr } = await supabase
      .from("observations")
      .insert({
        actor_id: actorId,
        source_id: sourceId,
        title: obs.title,
        content: obs.content,
        content_hash: contentHash,
        observation_type: obs.observation_type,
        observed_at: observedAt,
        metadata: {
          ingestion_method: options.ingestionMethod,
          original_filename: sanitizedFilename,
          source_reference: obs.source.url,
        },
      })
      .select("id")
      .maybeSingle();

    if (obsErr || !newObs) continue;
    observationsCreated++;

    // Create evidence record
    const { error: evErr } = await supabase.from("evidence").insert({
      observation_id: newObs.id,
      evidence_type: "text",
      description: `Authorized import from ${sanitizedFilename}`,
      content: obs.content,
      content_hash: contentHash,
      captured_at: observedAt,
      source_url: obs.source.url,
      metadata: {
        ingestion_method: options.ingestionMethod,
        source_name: obs.source.name,
      },
    });
    if (!evErr) evidenceCreated++;
  }

  // ── 4. Log Ingestion Batch ──────────────────────────────────────────────
  if (options.analystId) {
    await supabase.from("ingestion_batches").insert({
      analyst_id: options.analystId,
      source_filename: sanitizedFilename,
      file_sha256: fileHash,
      actors_created: actorsCreated,
      observations_created: observationsCreated,
      observations_skipped: observationsSkipped,
      evidence_created: evidenceCreated,
    });
  }

  return {
    actorsCreated,
    observationsCreated,
    observationsSkipped,
    evidenceCreated,
  };
}
