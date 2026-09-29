"use client";

import { Radio, ShieldAlert } from "lucide-react";

export function RadarSweep({ activeThreats = 4 }: { activeThreats?: number }) {
  return (
    <div className="radar-container scan-panel">
      <div className="radar-header">
        <div className="radar-title-group">
          <span className="threat-dot" aria-hidden="true" />
          <span className="radar-title">PERIMETER THREAT RADAR</span>
        </div>
        <span className="radar-badge">
          <Radio size={12} className="radar-badge-icon" aria-hidden="true" />
          LIVE 360° SWEEP
        </span>
      </div>

      <div className="radar-display">
        {/* Concentric rings */}
        <div className="radar-ring radar-ring-3" />
        <div className="radar-ring radar-ring-2" />
        <div className="radar-ring radar-ring-1" />

        {/* Crosshairs */}
        <div className="radar-crosshair radar-crosshair-h" />
        <div className="radar-crosshair radar-crosshair-v" />
        <div className="radar-crosshair radar-crosshair-d1" />
        <div className="radar-crosshair radar-crosshair-d2" />

        {/* Radar Sweep Needle */}
        <div className="radar-sweep-needle" />

        {/* Threat Blips */}
        <div className="radar-blip blip-1" title="Threat Vector: C2 Infrastructure" />
        <div className="radar-blip blip-2" title="Threat Vector: Credential Harvest" />
        <div className="radar-blip blip-3" title="Threat Vector: Ransomware Beacon" />
        <div className="radar-blip blip-4" title="Threat Vector: Tor Exit Node" />

        {/* Center Point */}
        <div className="radar-center" />
      </div>

      <div className="radar-footer">
        <div className="radar-stat">
          <span className="radar-stat-label">SCAN RANGE</span>
          <span className="radar-stat-value">GLOBAL / AS4837</span>
        </div>
        <div className="radar-stat">
          <span className="radar-stat-label">ACTIVE BLIPS</span>
          <span className="radar-stat-value text-accent">{activeThreats} DETECTED</span>
        </div>
        <div className="radar-stat">
          <span className="radar-stat-label">SWEEP CYCLE</span>
          <span className="radar-stat-value">4.0s / 360°</span>
        </div>
      </div>
    </div>
  );
}
