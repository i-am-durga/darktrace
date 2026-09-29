import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { getSupabaseConfig } from "./config";

describe("getSupabaseConfig", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("returns null when either URL or key is missing", () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    expect(getSupabaseConfig()).toBeNull();

    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    expect(getSupabaseConfig()).toBeNull();
  });

  it("returns url and key when both are configured", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "test-anon-key";

    const config = getSupabaseConfig();
    expect(config).not.toBeNull();
    expect(config?.url).toBe("https://example.supabase.co");
    expect(config?.key).toBe("test-anon-key");
  });
});
