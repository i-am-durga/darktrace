/**
 * Application-wide constants for query limits, validation bounds, and defaults.
 * Centralizing these prevents magic numbers scattered across the codebase.
 */

// ── Upload & Ingestion ──────────────────────────────────────────────────────
/** Maximum file upload size in bytes (2 MB) */
export const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;

/** Maximum combined actor + observation records per single ingestion upload */
export const MAX_INGESTION_RECORDS = 200;

// ── Query Page Sizes ────────────────────────────────────────────────────────
/** Default page size for list queries (actors, observations, etc.) */
export const QUERY_LIMIT_DEFAULT = 500;

/** Page size for lightweight count/lookup queries */
export const QUERY_LIMIT_SMALL = 200;

/** Page size for search & graph queries that aggregate multiple entity types */
export const QUERY_LIMIT_LARGE = 1000;

/** Maximum analysis results per page */
export const QUERY_LIMIT_ANALYSIS = 100;

/** Maximum alerts per page */
export const QUERY_LIMIT_ALERTS = 200;

/** Maximum evidence items per page */
export const QUERY_LIMIT_EVIDENCE = 300;

/** Maximum entities per category in global search */
export const QUERY_LIMIT_SEARCH = 300;

/** Maximum timeline events */
export const QUERY_LIMIT_TIMELINE = 500;

/** Maximum infrastructure records */
export const QUERY_LIMIT_INFRASTRUCTURE = 500;

/** Maximum active investigation cases listed */
export const QUERY_LIMIT_INVESTIGATIONS = 100;

/** Maximum records loaded for reports aggregation */
export const QUERY_LIMIT_REPORTS = 100;

// ── Intelligence Analysis ───────────────────────────────────────────────────
/** Maximum actors to generate triage alerts for in a single analysis run */
export const ANALYSIS_ALERT_BATCH_SIZE = 5;

/** Jaccard similarity threshold for generating candidate relationships */
export const SIMILARITY_THRESHOLD = 0.4;

// ── Dashboard ───────────────────────────────────────────────────────────────
/** Number of days of observation history shown on the dashboard */
export const DASHBOARD_LOOKBACK_DAYS = 30;

/** Number of recent activity items shown on the dashboard */
export const DASHBOARD_RECENT_ACTIVITY_COUNT = 8;

// ── Validation ──────────────────────────────────────────────────────────────
/** Minimum password length */
export const MIN_PASSWORD_LENGTH = 8;

/** Maximum display name length */
export const MAX_DISPLAY_NAME_LENGTH = 80;

/** Maximum sanitized filename length */
export const MAX_FILENAME_LENGTH = 200;
