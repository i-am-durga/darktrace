import { NextResponse } from "next/server";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function GET() {
  const startTime = Date.now();
  let dbStatus = "unconfigured";
  let dbLatencyMs: number | null = null;

  const config = getSupabaseConfig();
  if (config) {
    try {
      const supabase = createClient(config.url, config.key);
      const pingStart = Date.now();
      const { error } = await supabase.from("actors").select("id", { count: "exact", head: true });
      dbLatencyMs = Date.now() - pingStart;
      dbStatus = error ? `db_error_${error.code || "unknown"}` : "connected";
    } catch {
      dbStatus = "connection_failed";
    }
  }

  const isHealthy = dbStatus === "connected" || dbStatus === "unconfigured";

  return NextResponse.json(
    {
      status: isHealthy ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      environment: process.env.NODE_ENV ?? "development",
      version: "0.1.0",
      responseTimeMs: Date.now() - startTime,
      database: {
        status: dbStatus,
        latencyMs: dbLatencyMs,
      },
    },
    { status: isHealthy ? 200 : 503 }
  );
}
