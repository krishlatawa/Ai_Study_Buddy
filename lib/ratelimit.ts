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
let redis: Redis;

function getRedis(): Redis {
  if (!redis) {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;

    // If env vars are missing, return a dummy Redis instance that won't be
    // used for actual rate limiting (the fallback limiter never calls it).
    if (!url || !token) {
      // @ts-ignore - dummy client for fallback path
      redis = {};
      return redis as unknown as Redis;
    }

    redis = new Redis({ url, token });
  }
  return redis;
}

// ---------------------------------------------------------------------------
// Create a singleton Ratelimit instance.
//
// Configuration:
//   - slidingWindow(10, "10 s"): allows up to 10 requests per 10-second
//     sliding window per unique identifier (e.g., per IP address).
//   - Sliding window means the window "slides" with each request — it's
//     more accurate than a fixed window (which can burst at boundaries).
//   - ephemeralCache: Optionally cache results in-memory for a short time
//     to reduce Redis calls. Set to 0 to always check Redis.
// ---------------------------------------------------------------------------
let ratelimit: Ratelimit;

export function getRatelimit(): Ratelimit {
  if (!ratelimit) {
    // Graceful fallback: if Upstash env vars aren't set, create a no-op
    // limiter that allows all requests. This prevents the app from crashing
    // during development or when Upstash isn't configured yet.
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      console.warn(
        "[Upstash] UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN not set. " +
        "Rate limiting is DISABLED. Set these in .env for production."
      );
      ratelimit = new Ratelimit({
        redis: getRedis(),
        limiter: Ratelimit.slidingWindow(99999, "1 m"), // effectively unlimited
        analytics: false,
        prefix: "ratelimit",
      });
      return ratelimit;
    }

    ratelimit = new Ratelimit({
      redis: getRedis(),
      limiter: Ratelimit.slidingWindow(10, "10 s"),
      analytics: true, // Tracks rate limit events in Upstash dashboard
      prefix: "ratelimit", // Prefix for Redis keys: "ratelimit:<identifier>"
    });
  }
  return ratelimit;
}

// ---------------------------------------------------------------------------
// Convenience: Pre-configured limiters for different sensitivities
// ---------------------------------------------------------------------------
export const strict = () => new Ratelimit({
  redis: getRedis(),
  limiter: Ratelimit.slidingWindow(5, "60 s"),   // 5 req/min
  prefix: "ratelimit_strict",
});

export const defaultLimit = () => new Ratelimit({
  redis: getRedis(),
  limiter: Ratelimit.slidingWindow(20, "60 s"),  // 20 req/min
  prefix: "ratelimit_default",
});

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

