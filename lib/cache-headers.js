import { NextResponse } from 'next/server';

/**
 * Utility helper to return a JSON response with Cache-Control headers.
 */
export function cachedJsonResponse(data, options = {}) {
  const {
    maxAge = 15,
    staleWhileRevalidate = 30,
    isPrivate = true,
    status = 200,
  } = options;

  const privacyDirective = isPrivate ? 'private' : 'public';
  const cacheControlValue = `${privacyDirective}, max-age=${maxAge}, stale-while-revalidate=${staleWhileRevalidate}`;

  return NextResponse.json(data, {
    status,
    headers: {
      'Cache-Control': cacheControlValue,
      'Vary':'Cookie',
    },
  });
}

/**
 * Utility helper for uncached responses (POST/PUT/DELETE mutations).
 */
export function noCacheJsonResponse(data, options = {}) {
  const { status = 200 } = options;

  return NextResponse.json(data, {
    status,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    },
  });
}
