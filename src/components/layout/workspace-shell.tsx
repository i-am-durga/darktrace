"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity, Bell, ChartNoAxesCombined, ChevronDown, CircleHelp, Clock3,
  FileCheck2, Fingerprint, FolderKanban, GitBranch, Globe2, LayoutDashboard,
  LogOut, Search, Settings2, ShieldAlert, Upload, Users,
} from "lucide-react";
import type { ReactNode } from "react";
import { logout } from "@/app/actions/auth";
import { DataStreamBackground } from "@/components/layout/data-stream";
import { PageTransition } from "@/components/layout/page-transition";

const navigation = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/actors", label: "Actors", icon: Users },
  { href: "/ingestion", label: "Ingestion", icon: Upload },
  { href: "/search", label: "Global search", icon: Search },
  { href: "/graph", label: "Graph analysis", icon: GitBranch },
  { href: "/timeline", label: "Timeline", icon: Clock3 },
  { href: "/evidence", label: "Evidence", icon: FileCheck2 },
  { href: "/infrastructure", label: "Infrastructure", icon: Globe2 },
  { href: "/investigations", label: "Investigations", icon: FolderKanban },
  { href: "/analysis", label: "Analysis", icon: ChartNoAxesCombined },
  { href: "/alerts", label: "Alerts", icon: ShieldAlert },
  { href: "/reports", label: "Reports", icon: Activity },
  { href: "/settings", label: "Settings", icon: Settings2 },
];



export function WorkspaceShell({ children, email }: { children: ReactNode; email: string }) {
  const pathname = usePathname();
  const active = navigation.find((item) => item.href === pathname || pathname.startsWith(`${item.href}/`));
  const initial = email.slice(0, 1).toUpperCase();

  return (
    <div className="workspace">
      <DataStreamBackground />
      <aside className="sidebar" aria-label="Main navigation">
        <Link href="/dashboard" className="sidebar-brand brand-lockup">
          <span className="brand-mark"><Fingerprint size={19} strokeWidth={1.8} aria-hidden="true" /></span>
          <span><span className="brand-name">DarkTrace</span><span className="brand-subtitle">Threat intelligence</span></span>
        </Link>
        <p className="sidebar-section-label">Workspace</p>
        <nav className="sidebar-nav">
          {navigation.map(({ href, label, icon: Icon }) => {
            const isActive = active?.href === href;
            return (
              <Link key={href} href={href} className={`nav-link${isActive ? " active" : ""}`} aria-current={isActive ? "page" : undefined}>
                <Icon size={15} strokeWidth={1.8} aria-hidden="true" />{label}
              </Link>
            );
          })}
        </nav>
        <div className="sidebar-bottom">
          <div className="profile-row">
            <span className="profile-avatar" aria-hidden="true">{initial}</span>
            <div className="profile-info"><div className="profile-email">{email}</div><div className="profile-role">Analyst account</div></div>
            <ChevronDown size={14} aria-hidden="true" className="profile-chevron" />
          </div>
          <form action={logout}>
            <button className="signout-button" type="submit"><LogOut size={14} aria-hidden="true" />Sign out</button>
          </form>
        </div>
      </aside>
      <div className="main-column">
        <header className="topbar">
          <div className="breadcrumb">Workspace <span aria-hidden="true">/</span> <strong>{active?.label ?? "Intelligence overview"}</strong></div>
          <div className="topbar-meta">
            <span className="system-status" title="Real-time telemetry status">
              <span className="threat-dot" aria-hidden="true" />
              <span className="threat-status-text">SYSTEM OPERATIONAL</span>
            </span>
            <Link href="/alerts" className="icon-link" aria-label="Notifications" title="Notifications"><Bell size={15} aria-hidden="true" /></Link>
            <a href="mailto:support@darktrace.example" className="icon-link" aria-label="Contact support" title="Contact support"><CircleHelp size={15} aria-hidden="true" /></a>
          </div>
        </header>
        <PageTransition>
          {children}
        </PageTransition>
      </div>
    </div>
  );
}