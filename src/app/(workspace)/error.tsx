"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function WorkspaceError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Workspace error boundary caught an exception:", error);
  }, [error]);

  return (
    <main className="content">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Workspace Notice</p>
          <h1>Component Error</h1>
          <p className="page-description">An error occurred while rendering this workspace view.</p>
        </div>
      </div>
      <section className="setup-notice" role="alert">
        <AlertTriangle size={20} aria-hidden="true" />
        <div>
          <strong>Intelligence module error</strong>
          <p>{error.message || "An unexpected error occurred while communicating with the database or rendering views."}</p>
          {error.digest && (
            <p className="mono-value error-digest-ref">
              Ref: {error.digest}
            </p>
          )}
          <div className="error-retry-wrap">
            <button onClick={() => reset()} className="auth-button error-retry-btn" type="button">
              <RotateCcw size={14} aria-hidden="true" />
              Retry module
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
