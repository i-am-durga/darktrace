import type { SupabaseClient } from "@supabase/supabase-js";
import { QUERY_LIMIT_DEFAULT, QUERY_LIMIT_LARGE } from "@/lib/constants";

export type GraphNode = {
  data: {
    id: string;
    label: string;
    type: "actor" | "identifier" | "observation" | "infrastructure" | "source";
    entityId: string;
    confidence?: string;
    detail?: string;
  };
};

export type GraphEdge = {
  data: {
    id: string;
    source: string;
    target: string;
    label: string;
    kind: "record_association" | "candidate";
    confidence?: string;
    score?: number | null;
    description: string;
  };
};

export async function getGraphData(supabase: SupabaseClient) {
  const [actors, identifiers, observations, infrastructure, sources, relationships] = await Promise.all([
    supabase.from("actors").select("id, canonical_name, category, confidence").order("canonical_name").limit(QUERY_LIMIT_DEFAULT),
    supabase.from("identifiers").select("id, type, value, actor_id").order("type").limit(QUERY_LIMIT_LARGE),
    supabase.from("observations").select("id, title, observation_type, actor_id, source_id").order("observed_at", { ascending: false }).limit(QUERY_LIMIT_LARGE),
    supabase.from("infrastructure").select("id, type, value, confidence, actor_id").order("type").limit(QUERY_LIMIT_LARGE),
    supabase.from("sources").select("id, name, type").order("name").limit(QUERY_LIMIT_DEFAULT),
    supabase.from("relationships").select("id, source_entity_type, source_entity_id, target_entity_type, target_entity_id, relationship_type, confidence, score, description").order("created_at", { ascending: false }).limit(QUERY_LIMIT_LARGE),
  ]);

  const errors = [actors, identifiers, observations, infrastructure, sources, relationships]
    .map((result) => result.error)
    .filter((error) => error !== null);

  if (errors.length > 0) {
    console.error("Graph query failed", { code: errors[0]?.code });
    return { status: "error" as const, nodes: [] as GraphNode[], edges: [] as GraphEdge[] };
  }

  const nodes: GraphNode[] = [];
  const nodeIds = new Set<string>();
  const addNode = (node: GraphNode) => {
    nodes.push(node);
    nodeIds.add(node.data.id);
  };

  for (const actor of actors.data ?? []) {
    addNode({ data: {
      id: `actor:${actor.id}`,
      entityId: actor.id,
      label: actor.canonical_name,
      type: "actor",
      confidence: actor.confidence,
      detail: actor.category,
    } });
  }
  for (const identifier of identifiers.data ?? []) {
    addNode({ data: {
      id: `identifier:${identifier.id}`,
      entityId: identifier.id,
      label: `${identifier.type}: ${identifier.value}`,
      type: "identifier",
      detail: identifier.type,
    } });
  }
  for (const observation of observations.data ?? []) {
    addNode({ data: {
      id: `observation:${observation.id}`,
      entityId: observation.id,
      label: observation.title,
      type: "observation",
      detail: observation.observation_type.replaceAll("_", " "),
    } });
  }
  for (const indicator of infrastructure.data ?? []) {
    addNode({ data: {
      id: `infrastructure:${indicator.id}`,
      entityId: indicator.id,
      label: indicator.value,
      type: "infrastructure",
      confidence: indicator.confidence,
      detail: indicator.type,
    } });
  }
  for (const source of sources.data ?? []) {
    addNode({ data: {
      id: `source:${source.id}`,
      entityId: source.id,
      label: source.name,
      type: "source",
      detail: source.type.replaceAll("_", " "),
    } });
  }

  const edges: GraphEdge[] = [];
  for (const identifier of identifiers.data ?? []) {
    if (!identifier.actor_id || !nodeIds.has(`actor:${identifier.actor_id}`)) continue;
    edges.push({ data: {
      id: `record:identifier:${identifier.id}`,
      source: `actor:${identifier.actor_id}`,
      target: `identifier:${identifier.id}`,
      label: "recorded identifier",
      kind: "record_association",
      description: "This identifier row references this actor through its actor_id field. It is not proof of a real-world identity.",
    } });
  }
  for (const observation of observations.data ?? []) {
    if (observation.actor_id && nodeIds.has(`actor:${observation.actor_id}`)) {
      edges.push({ data: {
        id: `record:observation:${observation.id}`,
        source: `actor:${observation.actor_id}`,
        target: `observation:${observation.id}`,
        label: "recorded observation",
        kind: "record_association",
        description: "This observation row references this actor record. It does not independently assert identity or attribution.",
      } });
    }
    if (observation.source_id && nodeIds.has(`source:${observation.source_id}`)) {
      edges.push({ data: {
        id: `record:source:${observation.id}`,
        source: `source:${observation.source_id}`,
        target: `observation:${observation.id}`,
        label: "observation source",
        kind: "record_association",
        description: "This observation row references this source record.",
      } });
    }
  }
  for (const indicator of infrastructure.data ?? []) {
    if (!indicator.actor_id || !nodeIds.has(`actor:${indicator.actor_id}`)) continue;
    edges.push({ data: {
      id: `record:infrastructure:${indicator.id}`,
      source: `actor:${indicator.actor_id}`,
      target: `infrastructure:${indicator.id}`,
      label: "recorded infrastructure",
      kind: "record_association",
      description: "This infrastructure row references this actor record; it is a database association, not an identity conclusion.",
    } });
  }

  for (const relationship of relationships.data ?? []) {
    const source = `${relationship.source_entity_type}:${relationship.source_entity_id}`;
    const target = `${relationship.target_entity_type}:${relationship.target_entity_id}`;
    if (!nodeIds.has(source) || !nodeIds.has(target)) continue;

    edges.push({ data: {
      id: `relationship:${relationship.id}`,
      source,
      target,
      label: relationship.relationship_type,
      kind: "candidate",
      confidence: relationship.confidence,
      score: relationship.score,
      description: relationship.description,
    } });
  }

  return { status: "ready" as const, nodes, edges };
}
