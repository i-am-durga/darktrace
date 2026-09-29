"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Clock3, FileText, ShoppingCart, MessageSquare, Shield, Globe2, StickyNote, CreditCard, KeyRound } from "lucide-react";

export type TimelineEvent = {
  id: string;
  title: string;
  content: string;
  content_hash: string;
  observation_type: string;
  observed_at: string;
  actor_name?: string;
  actor_id?: string;
  source_name?: string;
};

export function TimelineView({ events }: { events: TimelineEvent[] }) {
  const [selectedType, setSelectedType] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [search, setSearch] = useState<string>("");
  const [referenceTime] = useState(() => Date.now());

  const filtered = useMemo(() => {
    const dayMs = 24 * 60 * 60 * 1000;
    const q = search.trim().toLowerCase();


    return events.filter((ev) => {
      if (selectedType !== "all" && ev.observation_type !== selectedType) return false;

      if (dateFilter !== "all") {
        const evTime = new Date(ev.observed_at).getTime();
        if (dateFilter === "7d" && referenceTime - evTime > 7 * dayMs) return false;
        if (dateFilter === "30d" && referenceTime - evTime > 30 * dayMs) return false;
        if (dateFilter === "90d" && referenceTime - evTime > 90 * dayMs) return false;
      }

      if (q) {
        return (
          ev.title.toLowerCase().includes(q) ||
          ev.content.toLowerCase().includes(q) ||
          (ev.actor_name && ev.actor_name.toLowerCase().includes(q)) ||
          (ev.source_name && ev.source_name.toLowerCase().includes(q))
        );
      }

      return true;
    });
  }, [events, selectedType, dateFilter, search, referenceTime]);


  const typeIcons: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
    post: FileText,
    listing: ShoppingCart,
    message: MessageSquare,
    profile: Shield,
    infrastructure: Globe2,
    analyst_note: StickyNote,
    transaction_reference: CreditCard,
    credential_reference: KeyRound,
  };

  return (
    <div>
      <div className="actor-toolbar" style={{ flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
        <div className="actor-search" style={{ minWidth: 240 }}>
          <Clock3 size={15} aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search chronological observations or actors…"
          />
        </div>

        <div className="actor-filter">
          <label htmlFor="time-range">Time range</label>
          <select
            id="time-range"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          >
            <option value="all">All recorded time</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
        </div>

        <div className="actor-filter">
          <label htmlFor="type-filter">Observation type</label>
          <select
            id="type-filter"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
          >
            <option value="all">All observation types</option>
            <option value="post">Forum posts</option>
            <option value="listing">Marketplace listings</option>
            <option value="message">Messages</option>
            <option value="profile">Profile updates</option>
            <option value="infrastructure">Infrastructure signals</option>
            <option value="transaction_reference">Transactions</option>
            <option value="analyst_note">Analyst notes</option>
          </select>
        </div>

        <span className="actor-result-count">{filtered.length} observations</span>
      </div>

      {filtered.length === 0 ? (
        <section className="phase-empty">
          <div>
            <Clock3 size={24} aria-hidden="true" />
            <h2>No timeline events match criteria</h2>
            <p>Try adjusting your search query, observation type, or date range.</p>
          </div>
        </section>
      ) : (
        <div className="timeline-container">
          {filtered.map((item) => {
            const Icon = typeIcons[item.observation_type] || Clock3;
            return (
              <div key={item.id} className="timeline-entry">
                <span className="timeline-marker">
                  <Icon size={11} />
                </span>
                <article className="timeline-card">
                  <div className="timeline-top">
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span className="timeline-title">{item.title}</span>
                      <span className="tag-pill" style={{ textTransform: "capitalize" }}>
                        {item.observation_type.replace(/_/g, " ")}
                      </span>
                      {item.actor_name && (
                        <Link
                          href={item.actor_id ? `/graph?focus=${item.actor_id}` : "/actors"}
                          className="tag-pill"
                          style={{ borderColor: "#28443b", color: "#a4ebd3" }}
                        >
                          Actor: {item.actor_name}
                        </Link>
                      )}
                    </div>
                    <time style={{ color: "#7f8f89", fontSize: 11, whiteSpace: "nowrap" }} dateTime={item.observed_at}>
                      {new Date(item.observed_at).toLocaleString()}
                    </time>
                  </div>
                  <p className="timeline-content">{item.content}</p>
                  <div className="timeline-footer">
                    <span>Source: {item.source_name || "Authorized import"}</span>
                    <span className="hash-pill" title={`SHA-256: ${item.content_hash}`}>
                      SHA: {item.content_hash.slice(0, 12)}…
                    </span>
                  </div>
                </article>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
