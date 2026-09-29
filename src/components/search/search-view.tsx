"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, Users, Fingerprint, Activity, Globe2, FileCheck2, ExternalLink } from "lucide-react";

export type SearchEntity = {
  id: string;
  type: "actor" | "identifier" | "observation" | "evidence" | "infrastructure";
  title: string;
  subtitle: string;
  snippet: string;
  badge?: string;
  href: string;
};

export function SearchView({ initialEntities }: { initialEntities: SearchEntity[] }) {
  const [query, setQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return initialEntities.filter((item) => {
      if (filterType !== "all" && item.type !== filterType) return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        item.snippet.toLowerCase().includes(q) ||
        (item.badge && item.badge.toLowerCase().includes(q))
      );
    });
  }, [initialEntities, query, filterType]);

  const counts = useMemo(() => {
    const countsMap = { all: initialEntities.length, actor: 0, identifier: 0, observation: 0, evidence: 0, infrastructure: 0 };
    for (const item of initialEntities) {
      if (item.type in countsMap) {
        countsMap[item.type]++;
      }
    }
    return countsMap;
  }, [initialEntities]);

  const typeIcons = {
    actor: Users,
    identifier: Fingerprint,
    observation: Activity,
    evidence: FileCheck2,
    infrastructure: Globe2,
  };

  return (
    <div>
      <div className="actor-toolbar" style={{ marginBottom: 16 }}>
        <div className="actor-search" style={{ minHeight: 44 }}>
          <Search size={16} aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search across actors, identifiers, observations, evidence, and infrastructure…"
            aria-label="Global search query"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              style={{ background: "transparent", border: 0, color: "#8a9691", cursor: "pointer", fontSize: 12 }}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="filter-tabs">
        <button
          type="button"
          onClick={() => setFilterType("all")}
          className={`tab-btn${filterType === "all" ? " active" : ""}`}
        >
          All Entities <span className="count-badge">{counts.all}</span>
        </button>
        <button
          type="button"
          onClick={() => setFilterType("actor")}
          className={`tab-btn${filterType === "actor" ? " active" : ""}`}
        >
          <Users size={13} aria-hidden="true" /> Actors <span className="count-badge">{counts.actor}</span>
        </button>
        <button
          type="button"
          onClick={() => setFilterType("identifier")}
          className={`tab-btn${filterType === "identifier" ? " active" : ""}`}
        >
          <Fingerprint size={13} aria-hidden="true" /> Identifiers <span className="count-badge">{counts.identifier}</span>
        </button>
        <button
          type="button"
          onClick={() => setFilterType("observation")}
          className={`tab-btn${filterType === "observation" ? " active" : ""}`}
        >
          <Activity size={13} aria-hidden="true" /> Observations <span className="count-badge">{counts.observation}</span>
        </button>
        <button
          type="button"
          onClick={() => setFilterType("evidence")}
          className={`tab-btn${filterType === "evidence" ? " active" : ""}`}
        >
          <FileCheck2 size={13} aria-hidden="true" /> Evidence <span className="count-badge">{counts.evidence}</span>
        </button>
        <button
          type="button"
          onClick={() => setFilterType("infrastructure")}
          className={`tab-btn${filterType === "infrastructure" ? " active" : ""}`}
        >
          <Globe2 size={13} aria-hidden="true" /> Infrastructure <span className="count-badge">{counts.infrastructure}</span>
        </button>
      </div>

      <div className="panel" style={{ overflow: "hidden" }}>
        <div className="panel-header">
          <h2 className="panel-title">
            Search results {query ? `for "${query}"` : ""}
          </h2>
          <span className="panel-meta">{filtered.length} matches</span>
        </div>

        {filtered.length === 0 ? (
          <div className="activity-empty">
            <Search size={24} aria-hidden="true" />
            <p>No matching entities found in the intelligence registry.</p>
          </div>
        ) : (
          <div className="activity-list">
            {filtered.map((item) => {
              const Icon = typeIcons[item.type] || Activity;
              return (
                <article key={`${item.type}-${item.id}`} className="activity-row" style={{ gridTemplateColumns: "24px minmax(0, 1fr) auto", padding: "14px 18px" }}>
                  <span style={{ color: "var(--accent-strong)", display: "grid", placeItems: "center" }}>
                    <Icon size={16} aria-hidden="true" />
                  </span>
                  <div className="activity-detail">
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <strong style={{ fontSize: 13 }}>{item.title}</strong>
                      <span className="tag-pill" style={{ textTransform: "capitalize" }}>{item.type}</span>
                      {item.badge && <span className="tag-pill" style={{ borderColor: "#2e483e", color: "#9ee1c9" }}>{item.badge}</span>}
                    </div>
                    {item.subtitle && <span style={{ color: "#7e8f89", fontSize: 11 }}>{item.subtitle}</span>}
                    {item.snippet && (
                      <p style={{ margin: "4px 0 0", color: "#a5b4ad", fontSize: 11, lineClamp: 2, overflow: "hidden" }}>
                        {item.snippet}
                      </p>
                    )}
                  </div>
                  <Link href={item.href} className="table-action" style={{ display: "inline-flex", alignItems: "center", gap: 4, marginLeft: 8 }}>
                    Inspect <ExternalLink size={12} aria-hidden="true" />
                  </Link>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
