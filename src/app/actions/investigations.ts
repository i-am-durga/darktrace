"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type InvestigationActionState = {
  message?: string;
  error?: boolean;
};

const createInvestigationSchema = z.object({
  name: z.string().trim().min(3, "Case name must be at least 3 characters").max(180),
  description: z.string().trim().max(2000).default(""),
  status: z.enum(["open", "monitoring", "closed", "archived"]).default("open"),
});

export async function createInvestigation(
  _prev: InvestigationActionState,
  formData: FormData
): Promise<InvestigationActionState> {
  const parsed = createInvestigationSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    status: formData.get("status"),
  });

  if (!parsed.success) {
    return {
      message: parsed.error.issues[0]?.message ?? "Invalid case data provided.",
      error: true,
    };
  }

  const supabase = await createClient();
  if (!supabase) return { message: "Supabase connection not available.", error: true };

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { message: "You must be signed in as an analyst to open a case.", error: true };
  }

  const { error } = await supabase.from("investigations").insert({
    name: parsed.data.name,
    description: parsed.data.description,
    status: parsed.data.status,
    created_by: user.id,
  });

  if (error) {
    console.error("Failed to create investigation case", error);
    return { message: "Unable to create case in database. Verify your analyst role permissions.", error: true };
  }

  revalidatePath("/investigations");
  revalidatePath("/dashboard");
  return { message: "Investigation case successfully initiated." };
}
