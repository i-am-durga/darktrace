"use client";

import { useState, useMemo } from "react";
import { FileCheck2, ShieldCheck, Copy, Check, ExternalLink, Search, X } from "lucide-react";

export type EvidenceItem = {
  id: string;
  evidence_type: string;
  description: string;
  content: string;
  content_hash: string;
  captured_at: string;
  source_url?: string | null;
  metadata?: Record<string, unknown> | null;
  observation_title?: string;
};

export function EvidenceView({ items }: { items: EvidenceItem[] }) {
  const [filterType, setFilterType] = useState<string>("all");
  const [search, setSearch] = useState<string>("");
  const [activeItem, setActiveItem] = useState<EvidenceItem | null>(null);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [verificationResults, setVerificationResults] = useState<Record<string, boolean>>({});

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((item) => {
      if (filterType !== "all" && item.evidence_type !== filterType) return false;
      if (!q) return true;
      return (
        item.description.toLowerCase().includes(q) ||
        item.content.toLowerCase().includes(q) ||
        item.content_hash.toLowerCase().includes(q) ||
        (item.observation_title && item.observation_title.toLowerCase().includes(q))
      );
    });
  }, [items, filterType, search]);

  const copyToClipboard = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const verifyIntegrity = async (item: EvidenceItem) => {
    setVerifyingId(item.id);
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(item.content);
      const hashBuffer = await crypto.subtle.digest("SHA-256", data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const calculatedHash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
      const isMatch = calculatedHash.toLowerCase() === item.content_hash.toLowerCase();
      setVerificationResults((prev) => ({ ...prev, [item.id]: isMatch }));
    } catch (e) {
      console.error("Verification failed", e);
      setVerificationResults((prev) => ({ ...prev, [item.id]: false }));
    } finally {
      setVerifyingId(null);
    }
  };

  return (
    <div>
      <div className="actor-toolbar" style={{ flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
        <div className="actor-search" style={{ minWidth: 260 }}>
          <Search size={15} aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search evidence descriptions, content, or hash prefix…"
          />
        </div>

        <div className="actor-filter">
          <label htmlFor="evidence-type">Evidence category</label>
          <select
            id="evidence-type"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">All evidence types</option>
            <option value="text">Text excerpts</option>
            <option value="identifier">Identifiers</option>
            <option value="pgp">PGP keys</option>
            <option value="wallet">Crypto wallets</option>
            <option value="domain">Domains</option>
            <option value="certificate">Certificates</option>
            <option value="analyst_note">Analyst notes</option>
            <option value="metadata">Metadata</option>
          </select>
        </div>

        <span className="actor-result-count">{filtered.length} evidence records</span>
      </div>

      {filtered.length === 0 ? (
        <section className="phase-empty">
          <div>
            <FileCheck2 size={24} aria-hidden="true" />
            <h2>No evidence items found</h2>
            <p>Evidence is created automatically upon authorized file ingestion or seed load.</p>
          </div>
        </section>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {filtered.map((item) => {
            const isVerified = verificationResults[item.id];
            return (
              <article
                key={item.id}
                className="panel"
                style={{ padding: "16px 20px", display: "grid", gap: 10 }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <strong style={{ fontSize: 13, color: "#dbe5e0" }}>{item.description || "Evidence Record"}</strong>
                      <span className="tag-pill" style={{ textTransform: "capitalize" }}>{item.evidence_type}</span>
                      {item.source_url && (
                        <span className="tag-pill" style={{ borderColor: "#283b35", color: "#85c5b1" }}>
                          External Reference
                        </span>
                      )}
                    </div>
                    {item.observation_title && (
                      <p style={{ margin: "4px 0 0", color: "#82918b", fontSize: 11 }}>
                        Linked observation: {item.observation_title}
                      </p>
                    )}
                  </div>

                  <time style={{ color: "#788782", fontSize: 11 }} dateTime={item.captured_at}>
                    Captured: {new Date(item.captured_at).toLocaleDateString()}
                  </time>
                </div>

                <div style={{ background: "#131716", border: "1px solid #232d2b", borderRadius: 4, padding: "10px 14px", color: "#a5b4ae", fontSize: 12, maxHeight: 100, overflow: "hidden", textOverflow: "ellipsis" }}>
                  {item.content || "(No text content recorded)"}
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", paddingTop: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span className={`hash-pill${isVerified ? " hash-verified" : ""}`}>
                      <span style={{ color: "#667873" }}>SHA256:</span> {item.content_hash.slice(0, 16)}…{item.content_hash.slice(-8)}
                      <button
                        onClick={() => copyToClipboard(item.content_hash)}
                        className="hash-copy"
                        title="Copy full hash"
                        type="button"
                        aria-label="Copy SHA-256 hash"
                      >
                        {copiedHash === item.content_hash ? <Check size={12} color="#7fe0c1" /> : <Copy size={12} />}
                      </button>
                    </span>

                    <button
                      onClick={() => verifyIntegrity(item)}
                      disabled={verifyingId === item.id}
                      className="tab-btn"
                      style={{ padding: "3px 8px", fontSize: 10, border: "1px solid #283733" }}
                      type="button"
                    >
                      <ShieldCheck size={12} aria-hidden="true" />
                      {verifyingId === item.id ? "Verifying…" : isVerified ? "✓ Verified Authentic" : "Verify Integrity"}
                    </button>
                  </div>

                  <button
                    onClick={() => setActiveItem(item)}
                    className="table-action"
                    style={{ background: "transparent", border: 0, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4 }}
                    type="button"
                  >
                    View Details & Metadata <ExternalLink size={12} />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {activeItem && (
        <div className="modal-backdrop" onClick={() => setActiveItem(null)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Evidence Artifact Details</h2>
              <button onClick={() => setActiveItem(null)} className="modal-close" aria-label="Close dialog">
                <X size={16} />
              </button>
            </div>
            <div style={{ display: "grid", gap: 14 }}>
              <div>
                <dt style={{ color: "#7a8a84", fontSize: 11, marginBottom: 4 }}>Description</dt>
                <dd style={{ margin: 0, color: "#dbe5e0", fontSize: 13 }}>{activeItem.description}</dd>
              </div>

              <div>
                <dt style={{ color: "#7a8a84", fontSize: 11, marginBottom: 4 }}>Cryptographic Digest (SHA-256)</dt>
                <dd style={{ margin: 0, background: "#131716", padding: 8, borderRadius: 4, border: "1px solid #263330", wordBreak: "break-all", fontFamily: "Cascadia Code, monospace", fontSize: 11, color: "#8be0c3" }}>
                  {activeItem.content_hash}
                </dd>
              </div>

              <div>
                <dt style={{ color: "#7a8a84", fontSize: 11, marginBottom: 4 }}>Evidence Content</dt>
                <div style={{ background: "#131716", padding: 12, borderRadius: 4, border: "1px solid #232d2b", maxHeight: 180, overflowY: "auto", fontSize: 12, color: "#c2cfca", whiteSpace: "pre-wrap" }}>
                  {activeItem.content}
                </div>
              </div>

              {activeItem.source_url && (
                <div>
                  <dt style={{ color: "#7a8a84", fontSize: 11, marginBottom: 4 }}>Source URL Reference (Passive)</dt>
                  <dd style={{ margin: 0, color: "#87c5b1", fontSize: 11, wordBreak: "break-all" }}>
                    {activeItem.source_url} (Stored reference; not fetched)
                  </dd>
                </div>
              )}

              {activeItem.metadata && Object.keys(activeItem.metadata).length > 0 && (
                <div>
                  <dt style={{ color: "#7a8a84", fontSize: 11, marginBottom: 4 }}>Metadata JSON</dt>
                  <pre style={{ margin: 0, background: "#121615", padding: 10, borderRadius: 4, border: "1px solid #202b28", fontSize: 10, color: "#9cb5ab", overflowX: "auto" }}>
                    {JSON.stringify(activeItem.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
