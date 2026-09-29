"use client";

import { useActionState, useState, useTransition } from "react";
import { FileUp, ShieldCheck, Sparkles, Loader2 } from "lucide-react";
import { ingestAuthorizedFile } from "@/app/actions/ingestion";
import { loadDemoSampleData } from "@/app/actions/demo-seed";
import type { IngestionState } from "@/lib/ingestion/types";

const initialState: IngestionState = {};

export function IngestionForm() {
  const [state, formAction, pending] = useActionState(ingestAuthorizedFile, initialState);
  const [demoPending, startDemoTransition] = useTransition();
  const [demoMessage, setDemoMessage] = useState<{ text: string; error?: boolean } | null>(null);

  const handleLoadDemo = () => {
    setDemoMessage(null);
    startDemoTransition(async () => {
      const res = await loadDemoSampleData();
      if (res.message) {
        setDemoMessage({ text: res.message, error: res.error });
      }
    });
  };

  return (
    <div className="ingestion-layout">
      <section className="panel ingestion-panel">
        <div className="panel-header ingestion-panel-header">
          <div>
            <h2 className="panel-title">Import authorized records</h2>
            <span className="panel-meta">CSV or JSON · 2 MB max</span>
          </div>
          <button
            type="button"
            onClick={handleLoadDemo}
            disabled={demoPending || pending}
            className="auth-button demo-seed-btn"
          >
            {demoPending ? <Loader2 size={13} className="spinner" /> : <Sparkles size={13} />}
            {demoPending ? "Loading & Analyzing…" : "Load Demo Intel (1-Click)"}
          </button>
        </div>

        {demoMessage && (
          <div
            className={`ingestion-result${demoMessage.error ? " error" : " success"}`}
            role="status"
            aria-live="polite"
          >
            <strong>{demoMessage.text}</strong>
          </div>
        )}

        <form action={formAction} className="ingestion-form">
          <label className="upload-area" htmlFor="ingestion-file">
            <span className="upload-icon"><FileUp size={19} aria-hidden="true" /></span>
            <span className="upload-title">Choose a CSV or JSON file</span>
            <span className="upload-subtitle">Only files you are authorized to use. No crawlers or live collection.</span>
            <input id="ingestion-file" name="file" type="file" accept=".csv,.json,text/csv,application/json" required />
          </label>
          <div className="ingestion-format">
            <strong>CSV columns</strong>
            <code>actor_name, actor_category, actor_description, actor_status, actor_confidence, source_name, source_type, source_url, source_trust_level, title, content, observation_type, observed_at</code>
            <span>JSON accepts <code>actors</code> and <code>observations</code> arrays. Dates must be ISO 8601. Maximum 200 records per upload.</span>
            <div className="sample-links-row">
              <a
                href="/samples/authorized_threat_intel_sample.csv"
                download="authorized_threat_intel_sample.csv"
                className="table-action sample-link"
              >
                Download Sample CSV
              </a>
              <span className="sample-link-separator">•</span>
              <a
                href="/samples/authorized_threat_intel_sample.json"
                download="authorized_threat_intel_sample.json"
                className="table-action sample-link"
              >
                Download Sample JSON
              </a>
            </div>
          </div>
          <button className="auth-button ingestion-submit" type="submit" disabled={pending || demoPending}>
            {pending ? "Validating and importing…" : "Validate and import"}
            {!pending && <FileUp size={15} aria-hidden="true" />}
          </button>
          {state.message && (
            <div className={`ingestion-result${state.error ? " error" : " success"}`} role="status" aria-live="polite">
              <strong>{state.message}</strong>
              {state.counts && <p>{state.counts.actorsCreated} actors created · {state.counts.observationsCreated} observations imported · {state.counts.evidenceCreated} evidence records created · {state.counts.observationsSkipped} duplicates skipped</p>}
            </div>
          )}
        </form>
      </section>
      <aside className="ingestion-boundary">
        <ShieldCheck size={17} aria-hidden="true" />
        <div><strong>Authorized data only</strong><p>Import only public, synthetic, or explicitly authorized intelligence. Do not upload stolen credentials, private personal information, malware, or material you are not permitted to retain. Supplied URLs are stored as references and are never fetched.</p></div>
      </aside>
    </div>
  );
}

