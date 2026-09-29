"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Globe2, Copy, Check } from "lucide-react";

export type InfraRecord = {
  id: string;
  type: string;
  value: string;
  normalized_value: string;
  provider?: string | null;
  asn?: string | null;
  country?: string | null;
  confidence: string;
  first_seen?: string | null;
  last_seen?: string | null;
  actor_name?: string | null;
  actor_id?: string | null;
};

export function InfrastructureView({ records }: { records: InfraRecord[] }) {
  const [filterType, setFilterType] = useState<string>("all");
  const [search, setSearch] = useState<string>("");
  const [copiedValue, setCopiedValue] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return records.filter((r) => {
      if (filterType !== "all" && r.type !== filterType) return false;
      if (!q) return true;
      return (
        r.value.toLowerCase().includes(q) ||
        (r.provider && r.provider.toLowerCase().includes(q)) ||
        (r.asn && r.asn.toLowerCase().includes(q)) ||
        (r.country && r.country.toLowerCase().includes(q)) ||
        (r.actor_name && r.actor_name.toLowerCase().includes(q))
      );
    });
  }, [records, filterType, search]);

  const copyValue = (val: string) => {
    navigator.clipboard.writeText(val);
    setCopiedValue(val);
    setTimeout(() => setCopiedValue(null), 2000);
  };

  return (
    <div>
      <div className="actor-toolbar" style={{ flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
        <div className="actor-search" style={{ minWidth: 260 }}>
          <Globe2 size={15} aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search domains, IP addresses, ASN, hosting providers, countries…"
          />
        </div>

        <div className="actor-filter">
          <label htmlFor="infra-type">Indicator type</label>
          <select
            id="infra-type"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">All indicator types</option>
            <option value="domain">Domains</option>
            <option value="ip">IP addresses</option>
            <option value="certificate">SSL/TLS certificates</option>
            <option value="hosting">Hosting providers</option>
            <option value="asn">Autonomous systems (ASN)</option>
            <option value="dns">DNS nameservers</option>
            <option value="service_banner">Service banners</option>
            <option value="onion_service_reference">Onion service references</option>
          </select>
        </div>

        <span className="actor-result-count">{filtered.length} indicators</span>
      </div>

      {filtered.length === 0 ? (
        <section className="phase-empty">
          <div>
            <Globe2 size={24} aria-hidden="true" />
            <h2>No infrastructure indicators found</h2>
            <p>Infrastructure indicators are created via authorized observation ingestion or synthetic seed data.</p>
          </div>
        </section>
      ) : (
        <div className="panel" style={{ overflow: "hidden" }}>
          <div className="table-scroll">
            <table className="actor-table">
              <thead>
                <tr>
                  <th>Indicator value</th>
                  <th>Type</th>
                  <th>Network / Provider</th>
                  <th>Location</th>
                  <th>Confidence</th>
                  <th>Associated actor</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span className="mono-value" style={{ fontWeight: 600, color: "#e4ece8", fontSize: 12 }}>
                          {item.value}
                        </span>
                        <button
                          onClick={() => copyValue(item.value)}
                          className="hash-copy"
                          title="Copy indicator value"
                          type="button"
                          aria-label="Copy indicator"
                        >
                          {copiedValue === item.value ? <Check size={11} color="#7fe0c1" /> : <Copy size={11} />}
                        </button>
                      </div>
                    </td>
                    <td>
                      <span className="tag-pill" style={{ textTransform: "capitalize" }}>
                        {item.type.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "grid", gap: 2 }}>
                        <span style={{ color: "#d2dbd7", fontSize: 11 }}>{item.provider || "—"}</span>
                        {item.asn && <span className="mono-value" style={{ color: "#7f8e88" }}>{item.asn}</span>}
                      </div>
                    </td>
                    <td>
                      <span style={{ color: "#a5b3ad" }}>{item.country || "Global"}</span>
                    </td>
                    <td>
                      <span className={`confidence-label confidence-${item.confidence || "low"}`}>
                        {item.confidence || "low"}
                      </span>
                    </td>
                    <td>
                      {item.actor_name ? (
                        <Link
                          href={item.actor_id ? `/graph?focus=${item.actor_id}` : "/actors"}
                          className="table-action"
                        >
                          {item.actor_name}
                        </Link>
                      ) : (
                        <span style={{ color: "#74847e" }}>Unassigned</span>
                      )}
                    </td>
                    <td>
                      <Link
                        href={`/search?q=${encodeURIComponent(item.value)}`}
                        className="table-action"
                      >
                        Correlate
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
