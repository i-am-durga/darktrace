export default function WorkspaceLoading() {
  return (
    <main className="content">
      <div className="skeleton-heading">
        <div className="skeleton-line" style={{ width: 120, height: 12 }} />
        <div className="skeleton-line" style={{ width: 220, height: 28, marginTop: 8 }} />
        <div className="skeleton-line" style={{ width: 340, height: 14, marginTop: 8 }} />
      </div>

      <div className="stats-grid" style={{ marginTop: 24 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="stat-panel skeleton-box">
            <div className="skeleton-line" style={{ width: "60%", height: 12 }} />
            <div className="skeleton-line" style={{ width: "40%", height: 24, marginTop: 14 }} />
          </div>
        ))}
      </div>

      <div className="panel skeleton-box" style={{ minHeight: 320, marginTop: 16 }}>
        <div className="panel-header">
          <div className="skeleton-line" style={{ width: 140, height: 14 }} />
        </div>
        <div style={{ padding: 20, display: "grid", gap: 12 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton-line" style={{ width: `${85 - i * 8}%`, height: 16 }} />
          ))}
        </div>
      </div>
    </main>
  );
}
