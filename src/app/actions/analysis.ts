"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { runIntelligenceAnalysis, type AnalysisRunResult } from "@/lib/intelligence/analyzer";

export type AnalysisActionState = {
  message?: string;
  error?: boolean;
  result?: AnalysisRunResult;
};

export async function triggerAnalysis(): Promise<AnalysisActionState> {
  const supabase = await createClient();
  if (!supabase) return { message: "Supabase connection is not available.", error: true };

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { message: "You must be signed in as an analyst to run intelligence models.", error: true };
  }

  const result = await runIntelligenceAnalysis(supabase);
  if (!result.success) {
    return { message: result.message, error: true, result };
  }

  revalidatePath("/analysis");
  revalidatePath("/dashboard");
  revalidatePath("/graph");
  revalidatePath("/alerts");
  revalidatePath("/actors");

  return { message: result.message, error: false, result };
}
