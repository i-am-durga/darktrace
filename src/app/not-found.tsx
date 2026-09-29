import Link from "next/link";
import { Compass, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="error-screen">
      <div className="error-card">
        <div className="error-icon-wrap">
          <Compass size={32} aria-hidden="true" />
        </div>
        <p className="eyebrow">404 — Not Found</p>
        <h1>Record or page not found</h1>
        <p className="error-description">
          The requested intelligence resource, entity route, or view does not exist in this workspace.
        </p>
        <div className="error-actions">
          <Link href="/dashboard" className="auth-button error-primary-btn">
            <Home size={15} aria-hidden="true" />
            Return to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
