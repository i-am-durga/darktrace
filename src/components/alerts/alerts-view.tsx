"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ShieldAlert, CheckCircle, Clock } from "lucide-react";
import { updateAlertStatus } from "@/app/actions/alerts";

export type AlertItem = {
  id: string;
  type: string;
  severity: "critical" | "high" | "medium" | "low";
  title: string;
  description: string;
  status: "open" | "acknowledged" | "resolved";
  created_at: string;
  actor_name?: string | null;
  actor_id?: string | null;
};

export function AlertsView({ alerts }: { alerts: AlertItem[] }) {
  const [filterStatus, setFilterStatus] = useState<string>("open");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (filterStatus === "all") return alerts;
    return alerts.filter((a) => a.status === filterStatus);
  }, [alerts, filterStatus]);

  const counts = useMemo(() => {
    return {
      all: alerts.length,
      open: alerts.filter((a) => a.status === "open").length,
      acknowledged: alerts.filter((a) => a.status === "acknowledged").length,
      resolved: alerts.filter((a) => a.status === "resolved").length,
    };
  }, [alerts]);

  const handleStatusChange = async (id: string, newStatus: "open" | "acknowledged" | "resolved") => {
    setUpdatingId(id);
    try {
      await updateAlertStatus(id, newStatus);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div>
      <div className="filter-tabs">
        <button
          type="button"
          onClick={() => setFilterStatus("open")}
          className={`tab-btn${filterStatus === "open" ? " active" : ""}`}
        >
          Open Alerts <span className="count-badge">{counts.open}</span>
        </button>
        <button
          type="button"
          onClick={() => setFilterStatus("acknowledged")}
          className={`tab-btn${filterStatus === "acknowledged" ? " active" : ""}`}
        >
          In Progress <span className="count-badge">{counts.acknowledged}</span>
        </button>
        <button
          type="button"
          onClick={() => setFilterStatus("resolved")}
          className={`tab-btn${filterStatus === "resolved" ? " active" : ""}`}
        >
          Resolved <span className="count-badge">{counts.resolved}</span>
        </button>
        <button
          type="button"
          onClick={() => setFilterStatus("all")}
          className={`tab-btn${filterStatus === "all" ? " active" : ""}`}
        >
          All Activity <span className="count-badge">{counts.all}</span>
        </button>
      </div>

      {filtered.length === 0 ? (
        <section className="phase-empty">
          <div>
            <ShieldAlert size={24} aria-hidden="true" />
            <h2>No {filterStatus !== "all" ? filterStatus : ""} alerts</h2>
            <p>Your intelligence queue has no pending triage items in this category.</p>
          </div>
        </section>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {filtered.map((item) => (
            <article key={item.id} className="panel" style={{ padding: "16px 20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span className={`severity-pill severity-${item.severity}`}>
                      {item.severity}
                    </span>
                    <strong style={{ fontSize: 13, color: "#dbe5e1" }}>{item.title}</strong>
                    <span className="tag-pill" style={{ textTransform: "capitalize" }}>
                      {item.type.replace(/_/g, " ")}
                    </span>
                    {item.actor_name && (
                      <Link
                        href={item.actor_id ? `/graph?focus=${item.actor_id}` : "/actors"}
                        className="table-action"
                        style={{ fontSize: 11 }}
                      >
                        Actor: {item.actor_name}
                      </Link>
                    )}
                  </div>
                  <p style={{ margin: "8px 0 0", color: "#9daaa4", fontSize: 12, lineHeight: 1.55 }}>
                    {item.description}
                  </p>
                </div>

                <time style={{ color: "#74847e", fontSize: 11, whiteSpace: "nowrap" }} dateTime={item.created_at}>
                  {new Date(item.created_at).toLocaleString()}
                </time>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 12, paddingTop: 10, borderTop: "1px solid #202725" }}>
                {item.status === "open" && (
                  <button
                    onClick={() => handleStatusChange(item.id, "acknowledged")}
                    disabled={updatingId === item.id}
                    className="tab-btn"
                    style={{ border: "1px solid #364942", color: "#8bd0b9", padding: "4px 10px" }}
                    type="button"
                  >
                    <Clock size={12} aria-hidden="true" /> Acknowledge Alert
                  </button>
                )}

                {item.status !== "resolved" && (
                  <button
                    onClick={() => handleStatusChange(item.id, "resolved")}
                    disabled={updatingId === item.id}
                    className="tab-btn"
                    style={{ border: "1px solid #2e443b", color: "#a4ebd3", background: "#1a2a24", padding: "4px 10px" }}
                    type="button"
                  >
                    <CheckCircle size={12} aria-hidden="true" /> Mark as Resolved
                  </button>
                )}

                {item.status === "resolved" && (
                  <button
                    onClick={() => handleStatusChange(item.id, "open")}
                    disabled={updatingId === item.id}
                    className="tab-btn"
                    style={{ border: "1px solid #2e3634", color: "#8a9792", padding: "4px 10px" }}
                    type="button"
                  >
                    Reopen Alert
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
