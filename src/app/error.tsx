"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertOctagon, RotateCcw, Home } from "lucide-react";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error boundary triggered:", error);
  }, [error]);

  return (
    <div className="error-screen" role="alert">
      <div className="error-card">
        <div className="error-icon-wrap">
          <AlertOctagon size={32} aria-hidden="true" />
        </div>
        <p className="eyebrow">System Exception</p>
        <h1>An unexpected error occurred</h1>
        <p className="error-description">
          DarkTrace encountered an unhandled condition while processing this request. Diagnostic details have been logged defensively.
        </p>
        {error.digest && (
          <p className="error-digest">
            <span>Diagnostic reference:</span> <code>{error.digest}</code>
          </p>
        )}
        <div className="error-actions">
          <button onClick={() => reset()} className="auth-button error-primary-btn" type="button">
            <RotateCcw size={15} aria-hidden="true" />
            Retry operation
          </button>
          <Link href="/dashboard" className="error-secondary-link">
            <Home size={15} aria-hidden="true" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
