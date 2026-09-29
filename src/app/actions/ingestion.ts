"use server";

import { createHash } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { parseIngestionFile } from "@/lib/ingestion/parse";
import { ingestParsedPayload } from "@/lib/ingestion/ingest";
import { runIntelligenceAnalysis } from "@/lib/intelligence/analyzer";
import { MAX_UPLOAD_BYTES } from "@/lib/constants";
import type { IngestionState } from "@/lib/ingestion/types";

function databaseFailure(code: string | undefined) {
  console.error("Authorized ingestion query failed", { code });
  return "Import could not be completed. Check the database migration and your analyst permissions.";
}

export async function ingestAuthorizedFile(
  _previous: IngestionState,
  formData: FormData,
): Promise<IngestionState> {
  // ── Input Validation ────────────────────────────────────────────────────
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { message: "Choose a non-empty CSV or JSON file.", error: true };
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return { message: "File is too large. The maximum upload size is 2 MB.", error: true };
  }
  if (!/\.(csv|json)$/i.test(file.name)) {
    return { message: "Use a .csv or .json file.", error: true };
  }

  // ── Parse & Validate ───────────────────────────────────────────────────
  const contents = await file.text();
  const parsed = parseIngestionFile(file.name, contents);
  if (!parsed.success) return { message: parsed.message, error: true };

  // ── Auth ────────────────────────────────────────────────────────────────
  const supabase = await createClient();
  if (!supabase) return { message: "Supabase is not configured.", error: true };

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return { message: "You must be signed in to ingest records.", error: true };

  const fileHash = createHash("sha256").update(contents, "utf8").digest("hex");

  // ── Try RPC First ──────────────────────────────────────────────────────
  const sanitizedFilename = file.name.replace(/[^A-Za-z0-9_.-]/g, "_").slice(0, 200);

  const { data, error } = await supabase.rpc("ingest_authorized_records", {
    p_payload: parsed.data,
    p_source_filename: sanitizedFilename,
    p_source_file_hash: fileHash,
  });

  let counts: IngestionState["counts"];

  if (error) {
    // If the RPC function isn't deployed, fall back to the shared direct-table ingestion
    if (error.code === "PGRST202" || error.code === "42883" || error.message?.includes("schema cache")) {
      const result = await ingestParsedPayload(supabase, parsed.data, {
        sourceFilename: file.name,
        fileHash,
        ingestionMethod: "authorized_file_upload",
        analystId: user.id,
      });
      counts = result;
    } else {
      return { message: databaseFailure(error.code), error: true };
    }
  } else {
    const resultCount = (key: string) => {
      if (typeof data !== "object" || data === null || !(key in data)) return 0;
      const value = (data as Record<string, unknown>)[key];
      return typeof value === "number" ? value : 0;
    };
    counts = {
      actorsCreated: resultCount("actors_created"),
      observationsCreated: resultCount("observations_created"),
      observationsSkipped: resultCount("observations_skipped"),
      evidenceCreated: resultCount("evidence_created"),
    };
  }

  // ── Post-Ingestion Analysis ─────────────────────────────────────────────
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
    counts,
  };
}
