"use client";

import { useEffect, useState } from "react";
import { Terminal, ShieldCheck } from "lucide-react";

const logLines = [
  "initializing intelligence engine...",
  "mounting PostgreSQL threat cluster [OK]",
  "loading multi-source OSINT feeds (128 actors)...",
  "analyzing infrastructure graph & ASN linkages...",
  "evaluating persona, behavioral & temporal signals...",
  "correlation complete: 0 unhandled vulnerabilities",
  "threat status: SYSTEM OPERATIONAL",
];

export function TerminalTelemetry() {
  const [displayedLines, setDisplayedLines] = useState<string[]>([]);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [currentCharIndex, setCurrentCharIndex] = useState(0);

  useEffect(() => {
    if (currentLineIndex >= logLines.length) return;

    const fullLine = logLines[currentLineIndex];
    if (currentCharIndex < fullLine.length) {
      const timer = setTimeout(() => {
        setDisplayedLines((prev) => {
          const newLines = [...prev];
          newLines[currentLineIndex] = fullLine.substring(0, currentCharIndex + 1);
          return newLines;
        });
        setCurrentCharIndex((c) => c + 1);
      }, 24);
      return () => clearTimeout(timer);
    } else {
      const lineTimer = setTimeout(() => {
        setCurrentLineIndex((i) => i + 1);
        setCurrentCharIndex(0);
      }, 400);
      return () => clearTimeout(lineTimer);
    }
  }, [currentLineIndex, currentCharIndex]);

  return (
    <div className="terminal-widget scan-panel">
      <div className="terminal-header">
        <div className="terminal-dots">
          <span className="term-dot term-red" />
          <span className="term-dot term-yellow" />
          <span className="term-dot term-green" />
        </div>
        <div className="terminal-title">
          <Terminal size={12} aria-hidden="true" />
          <span>CYBER TELEMETRY FEED // live_stream.log</span>
        </div>
        <div className="terminal-status">
          <ShieldCheck size={12} className="text-accent" aria-hidden="true" />
          <span>ENCRYPTED</span>
        </div>
      </div>

      <div className="terminal-body" tabIndex={0} role="region" aria-label="Terminal telemetry stream">
        {displayedLines.map((line, idx) => (
          <div className="terminal-line" key={idx}>
            <span className="terminal-prompt">&gt;</span>
            <span className={idx === displayedLines.length - 1 && idx === logLines.length - 1 ? "text-accent-glow" : "terminal-text"}>
              {line}
            </span>
          </div>
        ))}
        {currentLineIndex < logLines.length && (
          <span className="terminal-cursor" aria-hidden="true">_</span>
        )}
      </div>
    </div>
  );
}
