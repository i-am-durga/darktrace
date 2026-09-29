"use client";

import { useState, useActionState, useMemo } from "react";
import Link from "next/link";
import { FolderKanban, Plus, Users, ArrowUpRight, X } from "lucide-react";
import { createInvestigation, type InvestigationActionState } from "@/app/actions/investigations";

export type InvestigationItem = {
  id: string;
  name: string;
  description: string;
  status: "open" | "monitoring" | "closed" | "archived";
  created_at: string;
  updated_at: string;
  entity_count: number;
};

const initialActionState: InvestigationActionState = {};

export function InvestigationsView({ cases }: { cases: InvestigationItem[] }) {
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [state, formAction, pending] = useActionState(createInvestigation, initialActionState);

  const filtered = useMemo(() => {
    if (filterStatus === "all") return cases;
    return cases.filter((c) => c.status === filterStatus);
  }, [cases, filterStatus]);

  const counts = useMemo(() => {
    return {
      all: cases.length,
      open: cases.filter((c) => c.status === "open").length,
      monitoring: cases.filter((c) => c.status === "monitoring").length,
      closed: cases.filter((c) => c.status === "closed").length,
      archived: cases.filter((c) => c.status === "archived").length,
    };
  }, [cases]);

  return (
    <div>
      <div className="actor-toolbar investigations-toolbar">
        <div className="filter-tabs investigations-tabs">
          <button
            type="button"
            onClick={() => setFilterStatus("all")}
            className={`tab-btn${filterStatus === "all" ? " active" : ""}`}
          >
            All Cases <span className="count-badge">{counts.all}</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus("open")}
            className={`tab-btn${filterStatus === "open" ? " active" : ""}`}
          >
            Open <span className="count-badge">{counts.open}</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus("monitoring")}
            className={`tab-btn${filterStatus === "monitoring" ? " active" : ""}`}
          >
            Monitoring <span className="count-badge">{counts.monitoring}</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus("closed")}
            className={`tab-btn${filterStatus === "closed" ? " active" : ""}`}
          >
            Closed <span className="count-badge">{counts.closed}</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="auth-button investigations-new-btn"
        >
          <Plus size={14} aria-hidden="true" /> New Investigation
        </button>
      </div>

      {filtered.length === 0 ? (
        <section className="phase-empty">
          <div>
            <FolderKanban size={24} aria-hidden="true" />
            <h2>No investigation cases in this view</h2>
            <p>Create a new case to correlate entities, organize evidence, and track hypotheses.</p>
          </div>
        </section>
      ) : (
        <div className="investigations-grid">
          {filtered.map((item) => (
            <article key={item.id} className="case-card">
              <div>
                <div className="case-header">
                  <h3 className="case-title">{item.name}</h3>
                  <span className={`tag-pill severity-${item.status === "open" ? "critical" : item.status === "monitoring" ? "medium" : "low"}`}>
                    {item.status}
                  </span>
                </div>
                <p className="case-description">{item.description || "No case summary recorded."}</p>
              </div>

              <div>
                <div className="case-meta">
                  <span className="case-meta-entities">
                    <Users size={12} /> {item.entity_count} linked entities
                  </span>
                  <time dateTime={item.created_at} className="case-meta-date">
                    {new Date(item.created_at).toLocaleDateString()}
                  </time>
                </div>
                <div className="case-card-footer">
                  <Link href={`/graph?focus=${item.id}`} className="table-action case-explore-link">
                    Explore Entities <ArrowUpRight size={12} />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Initiate Investigation Case</h2>
              <button onClick={() => setIsModalOpen(false)} className="modal-close" aria-label="Close dialog">
                <X size={16} />
              </button>
            </div>

            <form
              action={async (formData) => {
                await formAction(formData);
                setIsModalOpen(false);
              }}
              className="investigation-form"
            >
              <div className="field">
                <label htmlFor="case-name">Investigation Case Name</label>
                <input
                  id="case-name"
                  name="name"
                  type="text"
                  placeholder="e.g. Operation NightFox Credential Cluster"
                  required
                />
              </div>

              <div className="field">
                <label htmlFor="case-description">Case Objective / Hypotheses</label>
                <textarea
                  id="case-description"
                  name="description"
                  rows={3}
                  placeholder="Describe scope, passive indicators, and expected review checkpoints…"
                  className="investigation-textarea"
                />
              </div>

              <div className="field">
                <label htmlFor="case-status">Initial Status</label>
                <select
                  id="case-status"
                  name="status"
                  defaultValue="open"
                  className="investigation-select"
                >
                  <option value="open">Open (Active Investigation)</option>
                  <option value="monitoring">Monitoring (Passive Review)</option>
                  <option value="closed">Closed (Archived dossier)</option>
                </select>
              </div>

              <div className="investigation-modal-actions">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="auth-button investigation-cancel-btn"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="auth-button investigation-submit-btn"
                >
                  {pending ? "Creating case…" : "Create Case"}
                </button>
              </div>

              {state.message && (
                <div className={`auth-message${state.error ? " error" : ""}`} role="status">
                  {state.message}
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
