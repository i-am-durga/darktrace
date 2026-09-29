import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { WorkspaceShell } from "@/components/layout/workspace-shell";

export default async function WorkspaceLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  if (!supabase) redirect("/login");

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect("/login");

  return <WorkspaceShell email={user.email ?? "Analyst"}>{children}</WorkspaceShell>;
}