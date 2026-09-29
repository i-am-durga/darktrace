"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/** UUID v4 pattern — validates that alertId is a proper UUID, not arbitrary input */
const alertIdSchema = z.string().uuid("Invalid alert identifier.");
const alertStatusSchema = z.enum(["open", "acknowledged", "resolved"]);

export async function updateAlertStatus(alertId: string, status: "open" | "acknowledged" | "resolved") {
  // ── Input Validation ────────────────────────────────────────────────────
  const parsedId = alertIdSchema.safeParse(alertId);
  if (!parsedId.success) return { success: false, error: "Invalid alert identifier." };

  const parsedStatus = alertStatusSchema.safeParse(status);
  if (!parsedStatus.success) return { success: false, error: "Invalid status value." };

  // ── Auth ────────────────────────────────────────────────────────────────
  const supabase = await createClient();
  if (!supabase) return { success: false, error: "Supabase not configured." };

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return { success: false, error: "Unauthorized." };

  // ── Build Update Payload ────────────────────────────────────────────────
  const updates: Record<string, unknown> = { status: parsedStatus.data };
  if (parsedStatus.data === "acknowledged") {
    updates.acknowledged_at = new Date().toISOString();
    updates.acknowledged_by = user.id;
  }

  const { error } = await supabase
    .from("alerts")
    .update(updates)
    .eq("id", parsedId.data);

  if (error) {
    console.error("Failed to update alert status", { code: error.code });
    return { success: false, error: "Unable to update alert status. Check your permissions." };
  }

  revalidatePath("/alerts");
  revalidatePath("/dashboard");
  return { success: true };
}
