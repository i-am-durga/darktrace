"use client";

import { useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";

type Actor = {
  id: string;
  canonical_name: string;
  category: string;
  status: string;
  confidence: string;
  first_seen: string | null;
  last_seen: string | null;
};

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleDateString() : "Not recorded";
}

export function ActorDirectory({ actors }: { actors: Actor[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const categories = [...new Set(actors.map((actor) => actor.category))].sort();

  const filteredActors = actors.filter((actor) => {
    const matchesQuery = `${actor.canonical_name} ${actor.category}`.toLowerCase().includes(query.trim().toLowerCase());
    return matchesQuery && (category === "all" || actor.category === category) && (status === "all" || actor.status === status);
  });

  return (
    <>
      <div className="actor-toolbar">
        <label className="actor-search"><Search size={15} aria-hidden="true" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search actors" aria-label="Search actors" /></label>
        <label className="actor-filter">Category<select value={category} onChange={(event) => setCategory(event.target.value)}><option value="all">All categories</option>{categories.map((value) => <option key={value} value={value}>{value.replaceAll("_", " ")}</option>)}</select></label>
        <label className="actor-filter">Status<select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">All statuses</option><option value="active">Active</option><option value="monitoring">Monitoring</option><option value="inactive">Inactive</option><option value="archived">Archived</option></select></label>
        <span className="actor-result-count">{filteredActors.length} of {actors.length} actors</span>
      </div>
      {filteredActors.length === 0 ? (
        <section className="phase-empty actor-empty"><div><h2>No matching actors</h2><p>Adjust the search or filters to see other records.</p></div></section>
      ) : (
        <div className="table-scroll">
          <table className="actor-table">
            <thead><tr><th scope="col">Actor</th><th scope="col">Category</th><th scope="col">Status</th><th scope="col">Confidence</th><th scope="col">First seen</th><th scope="col">Last seen</th><th scope="col"><span className="sr-only">Graph</span></th></tr></thead>
            <tbody>
              {filteredActors.map((actor) => (
                <tr key={actor.id} id={actor.id}>
                  <th scope="row"><span className="actor-name">{actor.canonical_name}</span><span className="actor-id">{actor.id.slice(0, 8)}</span></th>
                  <td><span className="table-category">{actor.category.replaceAll("_", " ")}</span></td>
                  <td><span className={`state-label state-${actor.status}`}>{actor.status}</span></td>
                  <td><span className={`confidence-label confidence-${actor.confidence}`}>{actor.confidence}</span></td>
                  <td>{formatDate(actor.first_seen)}</td>
                  <td>{formatDate(actor.last_seen)}</td>
                  <td><Link className="table-action" href={`/graph?focus=actor:${actor.id}`}>Explore graph</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
