/**
 * Upstash Rate Limiter — Singleton Client
 *
 * HOW IT WORKS (conceptual):
 *
 * Traditional rate limiters store counters in the server's memory (RAM).
 * But on Vercel, each serverless function invocation runs on a DIFFERENT
 * machine (or "instance"). So an in-memory counter on Instance A knows
 * nothing about requests handled by Instance B or C.
 *
 * Upstash Redis solves this by storing counters in a remote Redis database
 * accessed via HTTP REST. This means:
 *
 *   1. Every serverless function, regardless of which physical machine
 *      runs it, talks to the SAME Redis store → counters are global.
 *   2. HTTP REST (not persistent TCP) means NO connection pooling, NO
 *      cold-start lockups — each request simply makes a fast HTTPS call
 *      to Upstash's global edge network.
 *   3. The sliding window algorithm is executed ON Upstash's server via
 *      Lua scripts, so the atomicity is guaranteed and the response is
 *      just a few milliseconds.
 *
 * DEPENDENCIES:
 *   npm install @upstash/ratelimit @upstash/redis
 *
 * ENVIRONMENT VARIABLES (.env.local):
 *   UPSTASH_REDIS_REST_URL="https://us1-xxxxx.upstash.io"
 *   UPSTASH_REDIS_REST_TOKEN="your-super-secret-token"
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// ---------------------------------------------------------------------------
// Create a singleton Redis client.
// "Singleton" means we only instantiate it ONCE and reuse it across all
// imports, rather than creating a new connection per request.
// ---------------------------------------------------------------------------
const hasUpstash = Boolean(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
);

let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (!hasUpstash) return null;
  if (!redis) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
  }
  return redis;
}

const noopLimiter = {
  limit: async (_id: string) => ({
    success: true,
    limit: 1000,
    remaining: 999,
    reset: Date.now() + 10000,
    pending: Promise.resolve(),
  }),
};

let ratelimit: { limit: (id: string) => Promise<{ success: boolean; limit: number; remaining: number; reset: number }> };

export function getRatelimit() {
  if (!ratelimit) {
    if (!hasUpstash) {
      ratelimit = noopLimiter;
      return ratelimit;
    }

    const r = getRedis();
    if (!r) {
      ratelimit = noopLimiter;
      return ratelimit;
    }

    ratelimit = new Ratelimit({
      redis: r,
      limiter: Ratelimit.slidingWindow(10, "10 s"),
      analytics: true,
      prefix: "ratelimit",
    });
  }
  return ratelimit;
}

export const strict = () => {
  if (!hasUpstash) return noopLimiter;
  const r = getRedis();
  if (!r) return noopLimiter;
  return new Ratelimit({
    redis: r,
    limiter: Ratelimit.slidingWindow(5, "60 s"),
    prefix: "ratelimit_strict",
  });
};

export const defaultLimit = () => {
  if (!hasUpstash) return noopLimiter;
  const r = getRedis();
  if (!r) return noopLimiter;
  return new Ratelimit({
    redis: r,
    limiter: Ratelimit.slidingWindow(20, "60 s"),
    prefix: "ratelimit_default",
  });
};

// ---------------------------------------------------------------------------
// Helper: Extract a safe identifier from a Next.js request.
//
// Uses Vercel's `x-forwarded-for` header (which is a comma-separated list
// of IPs from proxies), falling back to `x-real-ip`, then `unknown`.
// ---------------------------------------------------------------------------
export function getIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }
  return request.headers.get("x-real-ip") || "unknown";
}

// ---------------------------------------------------------------------------
// Helper: Build a standardized 429 response with rate-limit headers
// ---------------------------------------------------------------------------
export function rateLimitResponse(limit: number, remaining: number, reset: number): Response {
  const retryAfter = Math.max(1, Math.ceil((reset - Date.now()) / 1000));
  return Response.json(
    {
      error: `Too many requests. Please try again in ${retryAfter} second${retryAfter !== 1 ? "s" : ""}.`,
      retryAfter,
    },
    {
      status: 429,
      statusText: "Too Many Requests",
      headers: {
        "Retry-After": String(retryAfter),
        "X-RateLimit-Limit": String(limit),
        "X-RateLimit-Remaining": String(remaining),
        "X-RateLimit-Reset": String(reset),
      },
    }
  );
}

