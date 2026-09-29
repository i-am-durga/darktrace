"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import cytoscape, { type Core, type CytoscapeOptions } from "cytoscape";
import { Maximize2, Search, X } from "lucide-react";
import type { GraphEdge, GraphNode } from "@/lib/intelligence/graph";

const stylesheet: NonNullable<CytoscapeOptions["style"]> = [
  {
    selector: "node",
    style: {
      label: "data(label)",
      color: "#e4e9e6",
      "font-size": 9,
      "font-family": "Aptos, Segoe UI, sans-serif",
      "text-wrap": "wrap",
      "text-max-width": "104px",
      "text-valign": "center",
      "text-halign": "center",
      "text-outline-width": 2,
      "text-outline-color": "#151b19",
      "background-color": "#3d6e5c",
      width: 36,
      height: 36,
      "border-width": 1,
      "border-color": "#9ad7bd",
    },
  },
  { selector: 'node[type = "actor"]', style: { shape: "ellipse", width: 52, height: 52, "background-color": "#356c56", "border-color": "#a1dec0", "font-size": 10, "font-weight": 600 } },
  { selector: 'node[type = "identifier"]', style: { shape: "diamond", "background-color": "#3a6471", "border-color": "#8bc8d3" } },
  { selector: 'node[type = "observation"]', style: { shape: "round-rectangle", "background-color": "#65553b", "border-color": "#d7b975" } },
  { selector: 'node[type = "infrastructure"]', style: { shape: "hexagon", "background-color": "#5b4765", "border-color": "#c3a6d2" } },
  { selector: 'node[type = "source"]', style: { shape: "rectangle", "background-color": "#3a4c69", "border-color": "#9fb6db" } },
  {
    selector: "edge",
    style: {
      width: 1.5,
      "line-color": "#59716a",
      "target-arrow-color": "#73978a",
      "target-arrow-shape": "triangle",
      "curve-style": "bezier",
      label: "data(label)",
      color: "#a8b5af",
      "font-size": 7,
      "text-rotation": "autorotate",
      "text-background-color": "#141a18",
      "text-background-opacity": 0.9,
      "text-background-padding": "2px",
    },
  },
  { selector: 'edge[kind = "record_association"]', style: { "line-style": "dashed", "line-color": "#52635c", "target-arrow-shape": "none", color: "#91a099" } },
  { selector: ".search-match", style: { "border-width": 3, "border-color": "#f1d18e", "overlay-color": "#f1d18e", "overlay-opacity": 0.13 } },
  { selector: ":selected", style: { "border-width": 3, "border-color": "#eff7f1", "line-color": "#a4d5c0", "target-arrow-color": "#a4d5c0" } },
];

type Props = {
  nodes: GraphNode[];
  edges: GraphEdge[];
  focusId?: string;
};

type SelectedNode = GraphNode["data"];
type SelectedEdge = GraphEdge["data"];

const confidenceRank: Record<string, number> = { low: 1, medium: 2, high: 3 };

export function GraphViewer({ nodes, edges, focusId }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<Core | null>(null);
  const [search, setSearch] = useState("");
  const [relationshipType, setRelationshipType] = useState("all");
  const [minimumConfidence, setMinimumConfidence] = useState("low");
  const [selectedNode, setSelectedNode] = useState<SelectedNode | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<SelectedEdge | null>(null);

  const relationshipTypes = [...new Set(edges.map((edge) => edge.data.label))].sort();

  useEffect(() => {
    if (!containerRef.current) return;

    const graph = cytoscape({
      container: containerRef.current,
      elements: [...nodes, ...edges],
      style: stylesheet,
      layout: { name: "cose", animate: false, randomize: true, nodeRepulsion: () => 5000, idealEdgeLength: () => 115 },
      minZoom: 0.35,
      maxZoom: 2.5,
      wheelSensitivity: 0.18,
      selectionType: "single",
    });
    graphRef.current = graph;
    graph.on("tap", "node", (event) => {
      setSelectedNode(event.target.data() as SelectedNode);
      setSelectedEdge(null);
    });
    graph.on("tap", "edge", (event) => {
      setSelectedEdge(event.target.data() as SelectedEdge);
      setSelectedNode(null);
    });
    graph.on("tap", (event) => {
      if (event.target === graph) {
        setSelectedNode(null);
        setSelectedEdge(null);
      }
    });

    if (focusId) {
      const focused = graph.getElementById(focusId);
      if (focused.length > 0) {
        focused.select();
        graph.animate({ center: { eles: focused }, zoom: 1.15, duration: 250 });
        if (focused.isNode()) setSelectedNode(focused.data() as SelectedNode);
      }
    }

    return () => {
      graph.destroy();
      graphRef.current = null;
    };
  }, [nodes, edges, focusId]);

  useEffect(() => {
    const graph = graphRef.current;
    if (!graph) return;

    const query = search.trim().toLowerCase();
    graph.nodes().forEach((node) => {
      const data = node.data() as SelectedNode;
      const matches = !query || `${data.label} ${data.type} ${data.detail ?? ""}`.toLowerCase().includes(query);
      node.toggleClass("search-match", Boolean(query) && matches);
      node.style("opacity", query && !matches ? 0.22 : 1);
    });
    graph.edges().forEach((edge) => {
      const data = edge.data() as SelectedEdge;
      const typeMatches = relationshipType === "all" || data.label === relationshipType;
      const confidenceMatches = data.kind === "record_association"
        || (confidenceRank[data.confidence ?? ""] ?? 0) >= (confidenceRank[minimumConfidence] ?? 1);
      const visible = typeMatches && confidenceMatches;
      edge.style("display", visible ? "element" : "none");
      edge.style("opacity", query && !`${data.label} ${data.description}`.toLowerCase().includes(query) ? 0.24 : 1);
    });
  }, [search, relationshipType, minimumConfidence, nodes, edges]);

  function fitGraph() {
    graphRef.current?.fit(undefined, 42);
  }

  return (
    <div className="graph-workspace">
      <div className="graph-main">
        <div className="graph-toolbar">
          <label className="graph-search">
            <Search size={15} aria-hidden="true" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Find a node or relationship" aria-label="Search graph" />
            {search && <button type="button" onClick={() => setSearch("")} aria-label="Clear search"><X size={14} /></button>}
          </label>
          <label className="graph-filter">Relationship
            <select value={relationshipType} onChange={(event) => setRelationshipType(event.target.value)}>
              <option value="all">All types</option>
              {relationshipTypes.map((type) => <option key={type} value={type}>{type.replaceAll("_", " ")}</option>)}
            </select>
          </label>
          <label className="graph-filter">Confidence
            <select value={minimumConfidence} onChange={(event) => setMinimumConfidence(event.target.value)}>
              <option value="low">Any</option>
              <option value="medium">Medium or higher</option>
              <option value="high">High only</option>
            </select>
          </label>
          <button className="graph-icon-button" type="button" onClick={fitGraph} aria-label="Fit graph to view" title="Fit graph to view"><Maximize2 size={15} aria-hidden="true" /></button>
        </div>
        <div className="graph-canvas" ref={containerRef} role="img" aria-label={`Relationship graph with ${nodes.length} nodes and ${edges.length} record links and candidate relationships`} />

        <div className="graph-legend" aria-label="Graph node types">
          <span><i className="legend-shape actor-shape" /> Actor</span>
          <span><i className="legend-shape identifier-shape" /> Identifier</span>
          <span><i className="legend-shape observation-shape" /> Observation</span>
          <span><i className="legend-shape infrastructure-shape" /> Infrastructure</span>
          <span><i className="legend-shape source-shape" /> Source</span>
        </div>
      </div>

      <aside className="graph-detail" aria-live="polite">
        {selectedNode ? (
          <>
            <p className="eyebrow">Selected node</p>
            <h2>{selectedNode.label}</h2>
            <dl>
              <div><dt>Type</dt><dd>{selectedNode.type}</dd></div>
              {selectedNode.detail && <div><dt>Category</dt><dd>{selectedNode.detail}</dd></div>}
              {selectedNode.confidence && <div><dt>Assessment confidence</dt><dd>{selectedNode.confidence}</dd></div>}
              <div><dt>Record ID</dt><dd className="mono-value">{selectedNode.entityId}</dd></div>
            </dl>
            {selectedNode.type === "actor" && <Link className="graph-detail-link" href={`/actors#${selectedNode.entityId}`}>Find actor in directory</Link>}
          </>
        ) : selectedEdge?.kind === "record_association" ? (
          <>
            <p className="eyebrow">Database record link</p>
            <h2>{selectedEdge.label}</h2>
            <dl><div><dt>Association</dt><dd>{selectedEdge.description}</dd></div></dl>
          </>
        ) : selectedEdge ? (
          <>
            <p className="eyebrow">Candidate relationship</p>
            <h2>{selectedEdge.label.replaceAll("_", " ")}</h2>
            <dl>
              <div><dt>Confidence</dt><dd>{selectedEdge.confidence ?? "Not scored"}</dd></div>
              {selectedEdge.score != null && <div><dt>Demonstration score</dt><dd>{selectedEdge.score.toFixed(2)}</dd></div>}
              <div><dt>Analyst note</dt><dd>{selectedEdge.description || "No description supplied."}</dd></div>
            </dl>
          </>
        ) : (
          <div className="graph-empty-detail"><p className="eyebrow">Graph guide</p><h2>Candidate connections</h2><p>Select a node or edge to review its type and context. A graph link is a correlation hypothesis, not proof of identity.</p></div>
        )}
        <p className="graph-disclaimer">Database links show stored record associations. Candidate correlations require analyst review and do not establish identity or wrongdoing.</p>
      </aside>
    </div>
  );
}
