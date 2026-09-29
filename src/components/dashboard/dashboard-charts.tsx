"use client";

import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from "recharts";

type Props = {
  observationActivity: { date: string; observations: number }[];
  actorCategories: { category: string; actors: number }[];
};

function formatDate(value: string) {
  return new Date(`${value}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

const tooltipStyle = {
  backgroundColor: "#1d2523",
  border: "1px solid #34413d",
  borderRadius: "5px",
  color: "#e4e9e6",
  fontSize: "11px",
};

export function DashboardCharts({ observationActivity, actorCategories }: Props) {
  return (
    <div className="charts-grid">
      <section className="panel" aria-labelledby="observations-title">
        <div className="panel-header">
          <h2 className="panel-title" id="observations-title">Observations over time</h2>
          <span className="panel-meta">Last 30 days</span>
        </div>
        <div className="chart-wrap" role="img" aria-label="Daily observation counts for the last 30 days">
          {observationActivity.every((point) => point.observations === 0) ? (
            <p className="chart-empty-label">No observations recorded in this period</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={observationActivity} margin={{ top: 12, right: 14, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="observationFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7bc8b3" stopOpacity={0.26} />
                    <stop offset="95%" stopColor="#7bc8b3" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#293331" strokeDasharray="3 5" vertical={false} />
                <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fill: "#84918c", fontSize: 10 }} tickLine={false} axisLine={false} minTickGap={30} />
                <YAxis allowDecimals={false} tick={{ fill: "#84918c", fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} labelFormatter={(label) => formatDate(String(label))} />
                <Area type="monotone" dataKey="observations" name="Observations" stroke="#82cfb8" strokeWidth={2} fill="url(#observationFill)" activeDot={{ r: 4, fill: "#a5e8d1", stroke: "#17201d", strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      <section className="panel" aria-labelledby="categories-title">
        <div className="panel-header">
          <h2 className="panel-title" id="categories-title">Actors by category</h2>
          <span className="panel-meta">Current inventory</span>
        </div>
        <div className="chart-wrap category-chart" role="img" aria-label="Actor counts by category">
          {actorCategories.length === 0 ? (
            <p className="chart-empty-label">No actor records available</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={actorCategories} layout="vertical" margin={{ top: 5, right: 18, left: 2, bottom: 5 }}>
                <CartesianGrid stroke="#293331" strokeDasharray="3 5" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fill: "#84918c", fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="category" width={108} tick={{ fill: "#aab5b0", fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="actors" name="Actors" fill="#7bc8b3" radius={[0, 3, 3, 0]} barSize={13} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>
    </div>
  );
}
