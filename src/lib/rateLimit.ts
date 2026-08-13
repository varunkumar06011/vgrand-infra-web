import { NextRequest } from 'next/server';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const store = new Map<string, RateLimitEntry>();

const MAX_STORE_SIZE = 10000;

function cleanupStore() {
  if (store.size > MAX_STORE_SIZE) {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (now > entry.resetTime) {
        store.delete(key);
      }
    }
  }
}

function getClientIdentifier(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';
  return ip;
}

/**
 * Simple in-memory rate limiter.
 * Returns true if the request is allowed, false if rate-limited.
 *
 * @param request - The NextRequest object
 * @param limit - Max requests allowed in the window (default: 10)
 * @param windowMs - Time window in milliseconds (default: 60_000 = 1 minute)
 */
export function rateLimit(
  request: NextRequest,
  limit: number = 10,
  windowMs: number = 60_000
): boolean {
  const identifier = getClientIdentifier(request);
  const key = `${identifier}`;
  const now = Date.now();

  cleanupStore();

  const entry = store.get(key);

  if (!entry || now > entry.resetTime) {
    store.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (entry.count >= limit) {
    return false;
  }

  entry.count++;
  return true;
}

export function rateLimitedResponse() {
  return Response.json(
    { success: false, error: 'Too many requests. Please try again later.' },
    { status: 429, headers: { 'Retry-After': '60' } }
  );
}
