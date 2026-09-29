"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateAlertStatus(alertId: string, status: "open" | "acknowledged" | "resolved") {
  const supabase = await createClient();
  if (!supabase) return { success: false, error: "Supabase not configured." };

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return { success: false, error: "Unauthorized." };

  const updates: Record<string, unknown> = { status };
  if (status === "acknowledged") {
    updates.acknowledged_at = new Date().toISOString();
    updates.acknowledged_by = user.id;
  }

  const { error } = await supabase.from("alerts").update(updates).eq("id", alertId);
  if (error) {
    console.error("Failed to update alert status", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/alerts");
  revalidatePath("/dashboard");
  return { success: true };
}
