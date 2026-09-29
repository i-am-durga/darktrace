import { describe, expect, it } from "vitest";
import { runIntelligenceAnalysis } from "./analyzer";
import type { SupabaseClient } from "@supabase/supabase-js";

describe("runIntelligenceAnalysis", () => {
  it("returns early when no actors or observations exist", async () => {
    const mockSupabase = {
      from: () => ({
        select: () => ({
          limit: async () => ({ data: [], error: null }),
        }),
      }),
    } as unknown as SupabaseClient;

    const result = await runIntelligenceAnalysis(mockSupabase);
    expect(result.success).toBe(true);
    expect(result.modelsEvaluated).toBe(0);
    expect(result.relationshipsGenerated).toBe(0);
    expect(result.alertsGenerated).toBe(0);
  });

  it("evaluates models and generates relationships for actors", async () => {
    const insertedResults: unknown[] = [];
    const insertedRelationships: unknown[] = [];
    const insertedAlerts: unknown[] = [];

    const mockActors = [
      { id: "act-1", canonical_name: "ShadowPhantom", category: "nation_state", status: "active", confidence: "high" },
      { id: "act-2", canonical_name: "ShadowGhost", category: "nation_state", status: "monitoring", confidence: "medium" },
    ];

    const mockObservations = [
      { id: "obs-1", title: "C2 Beacon", content: "Observed beaconing to 192.0.2.1", observation_type: "c2_traffic", actor_id: "act-1", observed_at: "2026-03-01T00:00:00Z" },
    ];

    const mockInfrastructure = [
      { id: "inf-1", type: "ip", value: "192.0.2.1", provider: "HostProvider", asn: "AS12345", actor_id: "act-1" },
    ];

    const mockIdentifiers = [
      { id: "id-1", type: "handle", value: "shadow_phantom", actor_id: "act-1" },
    ];

    const mockSupabase = {
      from: (table: string) => {
        if (table === "actors") {
          return {
            select: () => ({
              limit: async () => ({ data: mockActors, error: null }),
            }),
          };
        }
        if (table === "observations") {
          return {
            select: () => ({
              limit: async () => ({ data: mockObservations, error: null }),
            }),
          };
        }
        if (table === "infrastructure") {
          return {
            select: () => ({
              limit: async () => ({ data: mockInfrastructure, error: null }),
            }),
          };
        }
        if (table === "identifiers") {
          return {
            select: () => ({
              limit: async () => ({ data: mockIdentifiers, error: null }),
            }),
          };
        }
        if (table === "analysis_results") {
          return {
            insert: async (data: unknown) => {
              insertedResults.push(data);
              return { error: null };
            },
          };
        }
        if (table === "relationships") {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  limit: () => ({
                    maybeSingle: async () => ({ data: null }),
                  }),
                }),
              }),
            }),
            insert: async (data: unknown) => {
              insertedRelationships.push(data);
              return { error: null };
            },
          };
        }
        if (table === "alerts") {
          return {
            insert: async (data: unknown) => {
              insertedAlerts.push(data);
              return { error: null };
            },
          };
        }
        return {
          select: () => ({
            limit: async () => ({ data: [], error: null }),
          }),
        };
      },
    } as unknown as SupabaseClient;

    const result = await runIntelligenceAnalysis(mockSupabase);
    expect(result.success).toBe(true);
    expect(result.modelsEvaluated).toBeGreaterThan(0);
    expect(insertedResults.length).toBeGreaterThan(0);
  });
});
