import { parse } from "csv-parse/sync";
import { z } from "zod";

const categories = ["marketplace", "forum", "ransomware", "fraud", "credential_seller", "malware", "phishing", "infrastructure", "unknown"] as const;
const actorStatuses = ["active", "inactive", "monitoring", "archived"] as const;
const confidences = ["low", "medium", "high"] as const;
const sourceTypes = ["forum", "marketplace", "paste", "clearnet", "certificate", "dns", "public_dataset", "analyst_input", "synthetic_dataset"] as const;
const observationTypes = ["post", "listing", "message", "profile", "infrastructure", "transaction_reference", "credential_reference", "analyst_note"] as const;
const httpUrlSchema = z.url().max(2000).refine((value) => {
  const protocol = new URL(value).protocol;
  return protocol === "https:" || protocol === "http:";
}, "Source URL must use HTTP or HTTPS.");

function normalizeCategory(raw?: string): (typeof categories)[number] {
  if (!raw) return "unknown";
  const cleaned = raw.trim().toLowerCase().replace(/[\s-]+/g, "_");
  if ((categories as readonly string[]).includes(cleaned)) return cleaned as (typeof categories)[number];
  if (cleaned.includes("credential") || cleaned.includes("stealer")) return "credential_seller";
  if (cleaned.includes("ransom") || cleaned.includes("extort")) return "ransomware";
  if (cleaned.includes("malware") || cleaned.includes("trojan") || cleaned.includes("virus")) return "malware";
  if (cleaned.includes("phish") || cleaned.includes("spoof")) return "phishing";
  if (cleaned.includes("market") || cleaned.includes("shop") || cleaned.includes("vendor")) return "marketplace";
  if (cleaned.includes("forum") || cleaned.includes("board") || cleaned.includes("chat")) return "forum";
  if (cleaned.includes("fraud") || cleaned.includes("scam") || cleaned.includes("carding")) return "fraud";
  if (cleaned.includes("infra") || cleaned.includes("server") || cleaned.includes("host") || cleaned.includes("botnet")) return "infrastructure";
  return "unknown";
}

function normalizeStatus(raw?: string): (typeof actorStatuses)[number] {
  if (!raw) return "monitoring";
  const cleaned = raw.trim().toLowerCase().replace(/[\s-]+/g, "_");
  if ((actorStatuses as readonly string[]).includes(cleaned)) return cleaned as (typeof actorStatuses)[number];
  return "monitoring";
}

function normalizeConfidence(raw?: string): (typeof confidences)[number] {
  if (!raw) return "low";
  const cleaned = raw.trim().toLowerCase();
  if ((confidences as readonly string[]).includes(cleaned)) return cleaned as (typeof confidences)[number];
  return "low";
}

function normalizeSourceType(raw?: string): (typeof sourceTypes)[number] {
  if (!raw) return "analyst_input";
  const cleaned = raw.trim().toLowerCase().replace(/[\s-]+/g, "_");
  if ((sourceTypes as readonly string[]).includes(cleaned)) return cleaned as (typeof sourceTypes)[number];
  return "analyst_input";
}

function normalizeObservationType(raw?: string): (typeof observationTypes)[number] {
  if (!raw) return "analyst_note";
  const cleaned = raw.trim().toLowerCase().replace(/[\s-]+/g, "_");
  if ((observationTypes as readonly string[]).includes(cleaned)) return cleaned as (typeof observationTypes)[number];
  if (cleaned.includes("list")) return "listing";
  if (cleaned.includes("post") || cleaned.includes("blog")) return "post";
  if (cleaned.includes("msg") || cleaned.includes("message") || cleaned.includes("chat")) return "message";
  if (cleaned.includes("profile") || cleaned.includes("bio") || cleaned.includes("handle")) return "profile";
  if (cleaned.includes("infra") || cleaned.includes("domain") || cleaned.includes("ip")) return "infrastructure";
  if (cleaned.includes("tx") || cleaned.includes("transaction") || cleaned.includes("wallet") || cleaned.includes("pay")) return "transaction_reference";
  if (cleaned.includes("cred") || cleaned.includes("dump") || cleaned.includes("leak")) return "credential_reference";
  return "analyst_note";
}

const actorSchema = z.object({
  canonical_name: z.string().trim().min(1).max(160),
  category: z.preprocess((val) => {
    if (typeof val !== "string") return "unknown";
    const cleaned = val.trim().toLowerCase().replace(/[\s-]+/g, "_");
    if ((categories as readonly string[]).includes(cleaned)) return cleaned;
    if (cleaned.includes("credential") || cleaned.includes("stealer")) return "credential_seller";
    if (cleaned.includes("ransom") || cleaned.includes("extort")) return "ransomware";
    if (cleaned.includes("malware") || cleaned.includes("trojan")) return "malware";
    if (cleaned.includes("phish")) return "phishing";
    if (cleaned.includes("market") || cleaned.includes("shop")) return "marketplace";
    if (cleaned.includes("forum") || cleaned.includes("board")) return "forum";
    if (cleaned.includes("fraud") || cleaned.includes("scam")) return "fraud";
    if (cleaned.includes("infra") || cleaned.includes("server")) return "infrastructure";
    return val;
  }, z.enum(categories)).default("unknown"),
  description: z.string().trim().max(4000).default(""),
  status: z.preprocess((val) => (typeof val === "string" ? normalizeStatus(val) : val), z.enum(actorStatuses)).default("monitoring"),
  confidence: z.preprocess((val) => (typeof val === "string" ? normalizeConfidence(val) : val), z.enum(confidences)).default("low"),
});

const sourceSchema = z.object({
  name: z.string().trim().min(1).max(160),
  type: z.preprocess((val) => (typeof val === "string" ? normalizeSourceType(val) : val), z.enum(sourceTypes)).default("analyst_input"),
  url: z.union([httpUrlSchema, z.literal("")]).optional().transform((value) => value || undefined),
  trust_level: z.preprocess((val) => (typeof val === "string" ? normalizeConfidence(val) : val), z.enum(confidences)).default("medium"),
});

const observationSchema = z.object({
  actor_name: z.string().trim().min(1).max(160).optional(),
  source: sourceSchema,
  title: z.string().trim().min(1).max(240),
  content: z.string().max(100_000),
  observation_type: z.preprocess((val) => (typeof val === "string" ? normalizeObservationType(val) : val), z.enum(observationTypes)),
  observed_at: z.iso.datetime({ offset: true }).optional(),
});

const payloadSchema = z.object({
  actors: z.array(actorSchema).default([]),
  observations: z.array(observationSchema).default([]),
}).refine((payload) => payload.actors.length + payload.observations.length > 0, {
  message: "File must contain at least one actor or observation.",
}).refine((payload) => payload.actors.length + payload.observations.length <= 200, {
  message: "A single upload can contain at most 200 actor and observation records.",
});

function csvToPayload(csv: string) {
  const rows = parse(csv, {
    bom: true,
    columns: true,
    skip_empty_lines: true,
    trim: true,
    max_record_size: 110_000,
  }) as Record<string, string>[];

  const actors = new Map<string, unknown>();
  const observations = rows.map((row) => {
    const actorName = row.actor_name?.trim();
    if (actorName) {
      actors.set(actorName.toLowerCase(), {
        canonical_name: actorName,
        category: normalizeCategory(row.actor_category),
        description: row.actor_description || "",
        status: normalizeStatus(row.actor_status),
        confidence: normalizeConfidence(row.actor_confidence),
      });
    }

    let observedAt: string | undefined = row.observed_at?.trim() || undefined;
    if (observedAt) {
      const parsedDate = new Date(observedAt);
      if (!isNaN(parsedDate.getTime())) {
        observedAt = parsedDate.toISOString();
      } else {
        observedAt = undefined;
      }
    }

    return {
      actor_name: actorName || undefined,
      source: {
        name: row.source_name?.trim() || "Authorized analyst import",
        type: normalizeSourceType(row.source_type),
        url: row.source_url?.trim() || undefined,
        trust_level: normalizeConfidence(row.source_trust_level),
      },
      title: row.title?.trim() || "Untitled observation",
      content: row.content ?? "",
      observation_type: normalizeObservationType(row.observation_type),
      observed_at: observedAt,
    };
  });

  return { actors: [...actors.values()], observations };
}

export function parseIngestionFile(filename: string, contents: string) {
  let input: unknown;
  try {
    input = filename.toLowerCase().endsWith(".csv")
      ? csvToPayload(contents)
      : JSON.parse(contents);
  } catch {
    return { success: false as const, message: "File could not be parsed. Check that it is valid CSV or JSON." };
  }

  const result = payloadSchema.safeParse(input);
  if (!result.success) {
    return {
      success: false as const,
      message: result.error.issues[0]?.message ?? "File data is invalid.",
    };
  }

  return { success: true as const, data: result.data };
}
