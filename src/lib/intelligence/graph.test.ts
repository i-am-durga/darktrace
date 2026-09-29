import { describe, expect, it } from "vitest";
import { getGraphData } from "./graph";
import type { SupabaseClient } from "@supabase/supabase-js";

describe("getGraphData", () => {
  it("processes empty results gracefully", async () => {
    const mockSupabase = {
      from: () => ({
        select: () => ({
          order: () => ({
            limit: async () => ({ data: [], error: null }),
          }),
        }),
      }),
    } as unknown as SupabaseClient;

    const result = await getGraphData(mockSupabase);
    expect(result.status).toBe("ready");
    expect(result.nodes).toEqual([]);
    expect(result.edges).toEqual([]);
  });

  it("handles query error by returning status error", async () => {
    const mockSupabase = {
      from: () => ({
        select: () => ({
          order: () => ({
            limit: async () => ({ data: null, error: { code: "42P01", message: "relation does not exist" } }),
          }),
        }),
      }),
    } as unknown as SupabaseClient;

    const result = await getGraphData(mockSupabase);
    expect(result.status).toBe("error");
    expect(result.nodes).toEqual([]);
    expect(result.edges).toEqual([]);
  });
});
