import { describe, expect, it, beforeEach } from "vitest";
import { InMemoryRateLimiter } from "./rate-limit";

describe("InMemoryRateLimiter", () => {
  let limiter: InMemoryRateLimiter;

  beforeEach(() => {
    limiter = new InMemoryRateLimiter(1000, 3); // 3 attempts per 1 second
  });

  it("allows requests up to the max limit", () => {
    const res1 = limiter.check("test-user");
    expect(res1.success).toBe(true);
    expect(res1.remaining).toBe(2);

    const res2 = limiter.check("test-user");
    expect(res2.success).toBe(true);
    expect(res2.remaining).toBe(1);

    const res3 = limiter.check("test-user");
    expect(res3.success).toBe(true);
    expect(res3.remaining).toBe(0);
  });

  it("blocks requests once limit is reached", () => {
    limiter.check("test-user");
    limiter.check("test-user");
    limiter.check("test-user");

    const blocked = limiter.check("test-user");
    expect(blocked.success).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.resetMs).toBeGreaterThan(0);
  });

  it("resets limits correctly", () => {
    limiter.check("test-user");
    limiter.check("test-user");
    limiter.reset("test-user");

    const res = limiter.check("test-user");
    expect(res.success).toBe(true);
    expect(res.remaining).toBe(2);
  });

  it("tracks different keys independently", () => {
    limiter.check("user-1");
    limiter.check("user-1");
    limiter.check("user-1");

    expect(limiter.check("user-1").success).toBe(false);
    expect(limiter.check("user-2").success).toBe(true);
  });
});
