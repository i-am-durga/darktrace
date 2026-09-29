"use client";

import { useState, useMemo, useTransition } from "react";
import Link from "next/link";
import { ChartNoAxesCombined, CheckCircle2, Info, ArrowRight, Sparkles, Loader2 } from "lucide-react";
import { triggerAnalysis } from "@/app/actions/analysis";

export type AnalysisItem = {
  id: string;
  actor_name?: string;
  actor_id?: string;
  analysis_type: string;
  score: number;
  confidence: string;
  signals: string[];
  summary: string;
  created_at: string;
};

export function AnalysisView({ analyses }: { analyses: AnalysisItem[] }) {
  const [filterType, setFilterType] = useState<string>("all");
  const [activeAnalysis, setActiveAnalysis] = useState<AnalysisItem | null>(analyses[0] || null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleRunAnalysis = () => {
    setStatusMessage(null);
    startTransition(async () => {
      const res = await triggerAnalysis();
      if (res.message) {
        setStatusMessage(res.message);
      }
    });
  };

  const filtered = useMemo(() => {
    if (filterType === "all") return analyses;
    return analyses.filter((a) => a.analysis_type === filterType);
  }, [analyses, filterType]);

  return (
    <div>
      <div className="actor-toolbar" style={{ flexWrap: "wrap", gap: 12, marginBottom: 16, justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <div className="actor-filter">
            <label htmlFor="analysis-type">Analysis model</label>
            <select
              id="analysis-type"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">All correlation models</option>
              <option value="persona_similarity">Persona similarity</option>
              <option value="behavioral_similarity">Behavioral similarity</option>
              <option value="infrastructure_correlation">Infrastructure correlation</option>
              <option value="identifier_correlation">Identifier correlation</option>
              <option value="timeline_correlation">Timeline correlation</option>
            </select>
          </div>

          <span className="actor-result-count">{filtered.length} correlation models evaluated</span>
        </div>

        <button
          onClick={handleRunAnalysis}
          disabled={isPending}
          className="auth-button"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 16px",
            fontSize: 13,
            cursor: isPending ? "not-allowed" : "pointer",
          }}
        >
          {isPending ? <Loader2 size={15} className="spinner" /> : <Sparkles size={15} />}
          {isPending ? "Running Correlation Models…" : "Run Intelligence Analysis"}
        </button>
      </div>

      {statusMessage && (
        <div
          className="panel"
          style={{
            marginBottom: 16,
            padding: "12px 16px",
            borderColor: "var(--accent)",
            background: "#162520",
            color: "#b0f2dc",
            fontSize: 13,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <Sparkles size={16} color="var(--accent)" />
          <span>{statusMessage}</span>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: 16 }}>
        <div style={{ display: "grid", gap: 12 }}>
          {filtered.length === 0 ? (
            <section className="phase-empty">
              <div>
                <ChartNoAxesCombined size={28} aria-hidden="true" />
                <h2>No analysis models evaluated yet</h2>
                <p>Execute multi-signal correlation across monitored actors, infrastructure, and observations.</p>
                <button
                  onClick={handleRunAnalysis}
                  disabled={isPending}
                  className="auth-button"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    margin: "16px auto 0",
                    padding: "9px 20px",
                    fontSize: 13,
                  }}
                >
                  {isPending ? <Loader2 size={15} className="spinner" /> : <Sparkles size={15} />}
                  {isPending ? "Evaluating Correlation Models…" : "Run Intelligence Analysis"}
                </button>
              </div>
            </section>
          ) : (
            filtered.map((item) => {
              const percentage = Math.round((item.score ?? 0) * 100);
              const isSelected = activeAnalysis?.id === item.id;
              return (
                <article
                  key={item.id}
                  onClick={() => setActiveAnalysis(item)}
                  className="panel"
                  style={{
                    padding: "16px 18px",
                    cursor: "pointer",
                    borderColor: isSelected ? "var(--accent)" : undefined,
                    background: isSelected ? "#192320" : undefined,
                    transition: "all 140ms ease",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                    <div>
                      <strong style={{ fontSize: 13, color: "#dbe5e1" }}>
                        {item.actor_name ? `Actor: ${item.actor_name}` : "Entity Candidate"}
                      </strong>
                      <span className="tag-pill" style={{ marginLeft: 8, textTransform: "capitalize" }}>
                        {item.analysis_type.replace(/_/g, " ")}
                      </span>
                    </div>
                    <span className={`confidence-label confidence-${item.confidence || "low"}`}>
                      {item.confidence}
                    </span>
                  </div>

                  <div style={{ marginTop: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#92a39d" }}>
                      <span>Explainable Correlation Index</span>
                      <strong style={{ color: "#a4ebd3", fontFamily: "Cascadia Code, monospace" }}>{percentage}%</strong>
                    </div>
                    <div className="similarity-bar-wrap">
                      <div className="similarity-bar-fill" style={{ width: `${percentage}%` }} />
                    </div>
                  </div>

                  <p style={{ margin: "8px 0 0", color: "#8a9a94", fontSize: 11, lineClamp: 2, overflow: "hidden" }}>
                    {item.summary}
                  </p>
                </article>
              );
            })
          )}
        </div>

        <div>
          <div className="panel" style={{ position: "sticky", top: 76, padding: 20 }}>
            <div className="panel-header" style={{ margin: "-20px -20px 16px", padding: "14px 20px" }}>
              <h2 className="panel-title">Model Signal Breakdown</h2>
              <span className="panel-meta">Explainable AI / Heuristics</span>
            </div>

            {activeAnalysis ? (
              <div style={{ display: "grid", gap: 16 }}>
                <div>
                  <dt style={{ color: "#74847e", fontSize: 10, textTransform: "uppercase", letterSpacing: ".08em" }}>Target Subject</dt>
                  <dd style={{ margin: "4px 0 0", color: "#e4ece8", fontSize: 15, fontWeight: 600 }}>
                    {activeAnalysis.actor_name || "Unassigned Entity"}
                  </dd>
                </div>

                <div>
                  <dt style={{ color: "#74847e", fontSize: 10, textTransform: "uppercase", letterSpacing: ".08em" }}>Deterministic Summary</dt>
                  <dd style={{ margin: "4px 0 0", color: "#a7b7b1", fontSize: 12, lineHeight: 1.6 }}>
                    {activeAnalysis.summary}
                  </dd>
                </div>

                <div>
                  <dt style={{ color: "#74847e", fontSize: 10, textTransform: "uppercase", letterSpacing: ".08em" }}>Supporting Signals ({activeAnalysis.signals.length})</dt>
                  <div className="signals-grid" style={{ marginTop: 8 }}>
                    {activeAnalysis.signals.map((sig, i) => (
                      <span key={i} className="tag-pill" style={{ borderColor: "#2d443c", color: "#9ee3cd", padding: "4px 8px" }}>
                        <CheckCircle2 size={11} color="#85dabf" /> {sig}
                      </span>
                    ))}
                  </div>
                </div>

                <div style={{ padding: "12px 14px", border: "1px solid #3b372c", borderRadius: 6, background: "#1b1a16", color: "#d6c6a1", fontSize: 11, display: "flex", gap: 10 }}>
                  <Info size={16} style={{ flexShrink: 0, color: "var(--warning)" }} />
                  <div>
                    <strong>Defensive Caveat</strong>
                    <p style={{ margin: "4px 0 0", color: "#ad9f81", lineHeight: 1.5 }}>
                      Similarity scores represent candidate intelligence hypotheses for human analyst triage. They do NOT establish legal identity, authorship, or guilt.
                    </p>
                  </div>
                </div>

                {activeAnalysis.actor_id && (
                  <div style={{ paddingTop: 8 }}>
                    <Link href={`/graph?focus=${activeAnalysis.actor_id}`} className="auth-button" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: 12 }}>
                      Inspect in Relationship Graph <ArrowRight size={14} />
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <div className="activity-empty">
                <Info size={20} />
                <p>Select a correlation evaluation on the left to inspect explainable signals.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
