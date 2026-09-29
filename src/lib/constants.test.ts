import { describe, expect, it } from "vitest";
import * as constants from "./constants";

describe("Application Constants", () => {
  it("defines sensible upload limits", () => {
    expect(constants.MAX_UPLOAD_BYTES).toBe(2 * 1024 * 1024);
    expect(constants.MAX_INGESTION_RECORDS).toBeGreaterThan(0);
    expect(constants.MAX_FILENAME_LENGTH).toBe(200);
  });

  it("defines bounded query limits", () => {
    expect(constants.QUERY_LIMIT_DEFAULT).toBe(500);
    expect(constants.QUERY_LIMIT_SMALL).toBe(200);
    expect(constants.QUERY_LIMIT_LARGE).toBe(1000);
    expect(constants.QUERY_LIMIT_ANALYSIS).toBe(100);
    expect(constants.QUERY_LIMIT_ALERTS).toBe(200);
    expect(constants.QUERY_LIMIT_EVIDENCE).toBe(300);
    expect(constants.QUERY_LIMIT_SEARCH).toBe(300);
    expect(constants.QUERY_LIMIT_TIMELINE).toBe(500);
    expect(constants.QUERY_LIMIT_INFRASTRUCTURE).toBe(500);
    expect(constants.QUERY_LIMIT_INVESTIGATIONS).toBe(100);
    expect(constants.QUERY_LIMIT_REPORTS).toBe(100);
  });

  it("defines intelligence correlation parameters", () => {
    expect(constants.ANALYSIS_ALERT_BATCH_SIZE).toBeGreaterThan(0);
    expect(constants.SIMILARITY_THRESHOLD).toBeGreaterThan(0);
    expect(constants.SIMILARITY_THRESHOLD).toBeLessThanOrEqual(1);
    expect(constants.DASHBOARD_LOOKBACK_DAYS).toBe(30);
    expect(constants.DASHBOARD_RECENT_ACTIVITY_COUNT).toBe(8);
  });
});
