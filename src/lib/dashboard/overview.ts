import type { SupabaseClient } from "@supabase/supabase-js";
import { DASHBOARD_LOOKBACK_DAYS, DASHBOARD_RECENT_ACTIVITY_COUNT, QUERY_LIMIT_LARGE } from "@/lib/constants";

const dayInMilliseconds = 24 * 60 * 60 * 1000;

export async function getDashboardOverview(supabase: SupabaseClient) {
  const since = new Date(Date.now() - (DASHBOARD_LOOKBACK_DAYS - 1) * dayInMilliseconds).toISOString();

  const [
    actorsResult,
    activeActorsResult,
    identifiersResult,
    relationshipsResult,
    evidenceResult,
    infrastructureResult,
    openAlertsResult,
    activeInvestigationsResult,
    actorCategoriesResult,
    observationsResult,
  ] = await Promise.all([
    supabase.from("actors").select("id", { count: "exact", head: true }),
    supabase.from("actors").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("identifiers").select("id", { count: "exact", head: true }),
    supabase.from("relationships").select("id", { count: "exact", head: true }),
    supabase.from("evidence").select("id", { count: "exact", head: true }),
    supabase.from("infrastructure").select("id", { count: "exact", head: true }),
    supabase.from("alerts").select("id", { count: "exact", head: true }).eq("status", "open"),
    supabase.from("investigations").select("id", { count: "exact", head: true }).in("status", ["open", "monitoring"]),
    supabase.from("actors").select("category").limit(QUERY_LIMIT_LARGE),
    supabase
      .from("observations")
      .select("id, title, observation_type, observed_at")
      .gte("observed_at", since)
      .order("observed_at", { ascending: true })
      .limit(QUERY_LIMIT_LARGE),
  ]);

  const errors = [
    ["actors", actorsResult.error],
    ["active actors", activeActorsResult.error],
    ["identifiers", identifiersResult.error],
    ["relationships", relationshipsResult.error],
    ["evidence", evidenceResult.error],
    ["infrastructure", infrastructureResult.error],
    ["alerts", openAlertsResult.error],
    ["investigations", activeInvestigationsResult.error],
    ["actor categories", actorCategoriesResult.error],
    ["observations", observationsResult.error],
  ] as const;
  const firstError = errors.find(([, error]) => error)?.[1];

  if (firstError) {
    console.error("Dashboard query failed", { code: firstError.code });
    return { status: "error" as const };
  }

  const categories = new Map<string, number>();
  for (const actor of actorCategoriesResult.data ?? []) {
    categories.set(actor.category, (categories.get(actor.category) ?? 0) + 1);
  }

  const observationCounts = new Map<string, number>();
  for (const observation of observationsResult.data ?? []) {
    const date = observation.observed_at.slice(0, 10);
    observationCounts.set(date, (observationCounts.get(date) ?? 0) + 1);
  }

  const observationActivity = Array.from({ length: DASHBOARD_LOOKBACK_DAYS }, (_, index) => {
    const date = new Date(Date.now() - (DASHBOARD_LOOKBACK_DAYS - 1 - index) * dayInMilliseconds).toISOString().slice(0, 10);
    return { date, observations: observationCounts.get(date) ?? 0 };
  });

  return {
    status: "ready" as const,
    stats: {
      actors: actorsResult.count ?? 0,
      activeActors: activeActorsResult.count ?? 0,
      identifiers: identifiersResult.count ?? 0,
      relationships: relationshipsResult.count ?? 0,
      evidence: evidenceResult.count ?? 0,
      infrastructure: infrastructureResult.count ?? 0,
      openAlerts: openAlertsResult.count ?? 0,
      investigations: activeInvestigationsResult.count ?? 0,
    },
    actorCategories: [...categories.entries()]
      .map(([category, actors]) => ({ category, actors }))
      .sort((a, b) => b.actors - a.actors),
    observationActivity,
    recentActivity: (observationsResult.data ?? []).slice(-DASHBOARD_RECENT_ACTIVITY_COUNT).reverse(),
  };
}
