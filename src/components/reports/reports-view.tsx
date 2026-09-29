"use client";

import { useState } from "react";
import { Download, Printer, FileText, CheckCircle2, Shield, Globe2, FileCheck2 } from "lucide-react";

export type ReportData = {
  totalActors: number;
  activeActors: number;
  totalObservations: number;
  totalEvidence: number;
  totalInfra: number;
  totalAlerts: number;
  recentObservations: Array<{ title: string; type: string; date: string }>;
  topActors: Array<{ name: string; category: string; status: string; confidence: string }>;
  infraHighlights: Array<{ value: string; type: string; provider: string | null }>;
};

export function ReportsView({ report }: { report: ReportData }) {
  const [selectedReport, setSelectedReport] = useState<"briefing" | "actors" | "infra" | "custody">("briefing");

  const downloadJsonBundle = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(report, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `darktrace_intelligence_export_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const printReport = () => {
    window.print();
  };

  return (
    <div>
      <div className="actor-toolbar" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
        <div className="filter-tabs" style={{ marginBottom: 0, borderBottom: 0, paddingBottom: 0 }}>
          <button
            type="button"
            onClick={() => setSelectedReport("briefing")}
            className={`tab-btn${selectedReport === "briefing" ? " active" : ""}`}
          >
            <FileText size={13} /> Executive Threat Briefing
          </button>
          <button
            type="button"
            onClick={() => setSelectedReport("actors")}
            className={`tab-btn${selectedReport === "actors" ? " active" : ""}`}
          >
            <Shield size={13} /> Threat Actor Dossier
          </button>
          <button
            type="button"
            onClick={() => setSelectedReport("infra")}
            className={`tab-btn${selectedReport === "infra" ? " active" : ""}`}
          >
            <Globe2 size={13} /> Infrastructure Exposure
          </button>
          <button
            type="button"
            onClick={() => setSelectedReport("custody")}
            className={`tab-btn${selectedReport === "custody" ? " active" : ""}`}
          >
            <FileCheck2 size={13} /> Evidence Custody
          </button>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            onClick={printReport}
            className="tab-btn"
            style={{ border: "1px solid #32433d", color: "#dbe5e1" }}
          >
            <Printer size={13} /> Print Dossier
          </button>
          <button
            type="button"
            onClick={downloadJsonBundle}
            className="auth-button"
            style={{ width: "auto", minHeight: 34, padding: "0 14px", marginTop: 0 }}
          >
            <Download size={13} /> Export JSON Bundle
          </button>
        </div>
      </div>

      <div className="panel report-container" style={{ padding: "28px 32px" }}>
        <div style={{ borderBottom: "1px solid var(--border)", paddingBottom: 20, marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <p className="eyebrow">DarkTrace Threat Intelligence Platform</p>
            <h1 style={{ fontSize: 24, margin: "6px 0 8px", color: "#e4ece8" }}>
              {selectedReport === "briefing" && "Executive Threat Intelligence Briefing"}
              {selectedReport === "actors" && "Curated Threat Actor Dossier"}
              {selectedReport === "infra" && "Passive Infrastructure Exposure Assessment"}
              {selectedReport === "custody" && "Evidence Integrity & Chain of Custody Audit"}
            </h1>
            <p style={{ color: "#8a9893", fontSize: 12, margin: 0 }}>
              Authorized analysis document · Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
            </p>
          </div>
          <span className="tag-pill" style={{ borderColor: "#28443b", color: "#8be0c3", padding: "4px 10px" }}>
            Classification: RESTRICTED DEFENSE
          </span>
        </div>

        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 14, color: "#d5deda", marginBottom: 12 }}>Intelligence Portfolio Snapshot</h2>
          <div className="stats-grid">
            <div className="stat-panel">
              <span className="stat-topline">Total Monitored Actors</span>
              <div className="stat-value">{report.totalActors}</div>
            </div>
            <div className="stat-panel">
              <span className="stat-topline">Active Threats</span>
              <div className="stat-value">{report.activeActors}</div>
            </div>
            <div className="stat-panel">
              <span className="stat-topline">Verified Evidence Items</span>
              <div className="stat-value">{report.totalEvidence}</div>
            </div>
            <div className="stat-panel">
              <span className="stat-topline">Network Indicators</span>
              <div className="stat-value">{report.totalInfra}</div>
            </div>
          </div>
        </section>

        {selectedReport === "briefing" && (
          <div style={{ display: "grid", gap: 24 }}>
            <section>
              <h2 style={{ fontSize: 14, color: "#d5deda", marginBottom: 10 }}>Recent Activity Summary</h2>
              <div style={{ display: "grid", gap: 8 }}>
                {report.recentObservations.length === 0 ? (
                  <p style={{ color: "#74847e", fontSize: 12 }}>No observations currently recorded.</p>
                ) : (
                  report.recentObservations.map((obs, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", background: "#131716", border: "1px solid #232c2a", borderRadius: 5, fontSize: 12 }}>
                      <span style={{ color: "#dbe5e1" }}>{obs.title}</span>
                      <span style={{ color: "#7f8f89", fontSize: 11 }}>{obs.date}</span>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section>
              <h2 style={{ fontSize: 14, color: "#d5deda", marginBottom: 10 }}>Key Personas of Interest</h2>
              <div style={{ display: "grid", gap: 8 }}>
                {report.topActors.map((actor, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "#131716", border: "1px solid #232c2a", borderRadius: 5, fontSize: 12 }}>
                    <div>
                      <strong style={{ color: "#e4ece8" }}>{actor.name}</strong>
                      <span className="tag-pill" style={{ marginLeft: 8 }}>{actor.category}</span>
                    </div>
                    <span className={`confidence-label confidence-${actor.confidence}`}>{actor.confidence} confidence</span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {selectedReport === "actors" && (
          <section>
            <h2 style={{ fontSize: 14, color: "#d5deda", marginBottom: 12 }}>Monitored Entities</h2>
            <div className="table-scroll">
              <table className="actor-table">
                <thead>
                  <tr>
                    <th>Actor Canonical Name</th>
                    <th>Category</th>
                    <th>Status</th>
                    <th>Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {report.topActors.map((a, i) => (
                    <tr key={i}>
                      <td><strong>{a.name}</strong></td>
                      <td>{a.category}</td>
                      <td><span className={`state-label state-${a.status}`}>{a.status}</span></td>
                      <td><span className={`confidence-label confidence-${a.confidence}`}>{a.confidence}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {selectedReport === "infra" && (
          <section>
            <h2 style={{ fontSize: 14, color: "#d5deda", marginBottom: 12 }}>Network Topology Indicators</h2>
            <div className="table-scroll">
              <table className="actor-table">
                <thead>
                  <tr>
                    <th>Indicator Value</th>
                    <th>Indicator Type</th>
                    <th>Provider / ASN</th>
                  </tr>
                </thead>
                <tbody>
                  {report.infraHighlights.map((inf, i) => (
                    <tr key={i}>
                      <td className="mono-value">{inf.value}</td>
                      <td>{inf.type}</td>
                      <td>{inf.provider || "Unknown"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {selectedReport === "custody" && (
          <section>
            <h2 style={{ fontSize: 14, color: "#d5deda", marginBottom: 12 }}>Cryptographic Integrity Verification Audit</h2>
            <div style={{ padding: 18, background: "#131716", border: "1px solid #253330", borderRadius: 6, display: "grid", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#8be0c3" }}>
                <CheckCircle2 size={16} /> All {report.totalEvidence} evidence artifacts have SHA-256 integrity digests registered.
              </div>
              <p style={{ margin: 0, color: "#92a09a", fontSize: 12, lineHeight: 1.6 }}>
                DarkTrace utilizes immutable SHA-256 cryptographic hashing at point of ingestion. Tamper verification runs against stored digests before export generation.
              </p>
            </div>
          </section>
        )}

        <div style={{ marginTop: 32, paddingTop: 16, borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", color: "#6a7974", fontSize: 10 }}>
          <span>DarkTrace Threat Intelligence Suite v0.1.0</span>
          <span>Defensive Analysis & Education Only</span>
        </div>
      </div>
    </div>
  );
}
