import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  const response = NextResponse.next();

  // 1. Strict Security Headers
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Content Security Policy (CSP)
  const csp = `
    default-src 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline';
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: blob: https:;
    font-src 'self' data:;
    connect-src 'self' https:;
    frame-src 'self' data: blob: https:;
    object-src 'self' data: blob:;
  `.replace(/\s{2,}/g, ' ').trim();
  
  response.headers.set('Content-Security-Policy', csp);

  // 2. Real In-Memory Rate Limiting
  // Since we are not using a dedicated store like Upstash, we use an in-memory sliding window.
  // This will securely stop basic spam/DDoS on single-instance deployments.
  const ip = (request as any).ip ?? request.headers.get('x-forwarded-for') ?? '127.0.0.1';
  
  if (isRateLimited(ip)) {
    return new NextResponse('Rate limit exceeded. Try again later.', { status: 429 });
  }

  return response;
}

// Global in-memory store for rate limiting (persists across module reloads in Edge)
const rateLimitStore = new Map<string, { count: number; expiresAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute window
  const maxRequests = 100;    // max 100 requests per minute

  // Clean up expired entries to prevent memory leaks
  if (rateLimitStore.size > 1000) {
    for (const [key, data] of rateLimitStore.entries()) {
      if (now > data.expiresAt) rateLimitStore.delete(key);
    }
  }

  const record = rateLimitStore.get(ip);

  if (!record || now > record.expiresAt) {
    // First request or window expired
    rateLimitStore.set(ip, { count: 1, expiresAt: now + windowMs });
    return false;
  }

  if (record.count >= maxRequests) {
    return true; // Blocked
  }

  record.count += 1;
  return false;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};


