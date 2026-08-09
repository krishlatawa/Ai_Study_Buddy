/**
 * In-Memory Sliding Window Rate Limiter
 *
 * Tracks request counts per identifier (IP or userId) within a time window.
 * Uses a Map — resets automatically when the server restarts.
 *
 * HOW IT WORKS (line-by-line):
 *
 * 1. Each request gets a unique key (e.g., "register:127.0.0.1" or "feynman:user_5")
 * 2. The limiter looks up the key in an internal Map
 * 3. If no entry exists, it creates one with a timestamp array containing [now]
 * 4. If an entry exists, it FILTERS out timestamps older than the window
 * 5. If the remaining count >= max, it blocks the request
 * 6. If under the limit, it adds the current timestamp and allows the request
 * 7. Old entries are periodically pruned to prevent memory leaks
 *
 * @param {Object} options
 * @param {number} options.windowMs - Time window in milliseconds (default: 60000 = 1 min)
 * @param {number} options.max - Max requests allowed within the window (default: 10)
 * @returns {Function} middleware(req) — returns null if allowed, or Response if blocked
 */

const stores = new Map(); // { key: [timestamp1, timestamp2, ...] }

// Periodically clean up stale entries every 60 seconds
setInterval(() => {
  const now = Date.now();
  for (const [key, timestamps] of stores.entries()) {
    const recent = timestamps.filter(ts => now - ts < 300000); // 5 min threshold
    if (recent.length === 0) {
      stores.delete(key);
    } else {
      stores.set(key, recent);
    }
  }
}, 60000);

export function rateLimit({ windowMs = 60000, max = 10 } = {}) {
  return (req) => {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || req.headers.get('x-real-ip')
      || 'unknown';

    // Use the URL path as part of the key so different endpoints have separate counters
    const path = req.nextUrl?.pathname || 'unknown';
    const key = `${path}:${ip}`;

    const now = Date.now();
    const timestamps = stores.get(key) || [];

    // STEP 3: Filter out timestamps older than the window
    const recentTimestamps = timestamps.filter(ts => now - ts < windowMs);

    // STEP 4: Check if over limit
    if (recentTimestamps.length >= max) {
      const oldestInWindow = recentTimestamps[0];
      const retryAfterMs = windowMs - (now - oldestInWindow);
      const retryAfterSec = Math.ceil(retryAfterMs / 1000);

      return {
        allowed: false,
        response: Response.json(
          {
            error: `Too many requests. Please try again in ${retryAfterSec} second${retryAfterSec !== 1 ? 's' : ''}.`,
            retryAfter: retryAfterSec,
          },
          {
            status: 429,
            headers: {
              'Retry-After': String(retryAfterSec),
              'X-RateLimit-Limit': String(max),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': String(Math.ceil((oldestInWindow + windowMs) / 1000)),
            },
          }
        ),
      };
    }

    // STEP 5: Under limit — add current timestamp
    recentTimestamps.push(now);
    stores.set(key, recentTimestamps);

    return {
      allowed: true,
      remaining: max - recentTimestamps.length,
      response: null,
    };
  };
}

/**
 * Pre-configured rate limiters for different endpoint sensitivities
 */
export const strictLimiter = rateLimit({ windowMs: 60000, max: 5 });   // 5 req/min — auth endpoints
export const defaultLimiter = rateLimit({ windowMs: 60000, max: 20 }); // 20 req/min — general mutations
export const generousLimiter = rateLimit({ windowMs: 60000, max: 60 }); // 60 req/min — reads / light mutations