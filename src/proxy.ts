import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  const response = NextResponse.next();

  // 1. Strict Security Headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Content Security Policy (CSP)
  // Only allow scripts from our own domain.
  // In production with Vercel Analytics/Inngest, you'd whitelist specific domains here.
  const csp = `
    default-src 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline';
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: https:;
    font-src 'self' data:;
    connect-src 'self' https:;
  `.replace(/\s{2,}/g, ' ').trim();
  
  response.headers.set('Content-Security-Policy', csp);

  // 2. Production Rate Limiting (Mocked)
  // In a real app, you would use @upstash/ratelimit here.
  const ip = (request as any).ip ?? request.headers.get('x-forwarded-for') ?? '127.0.0.1';
  
  // Mock logic: Block an imaginary malicious IP
  if (ip === '203.0.113.50') {
    return new NextResponse('Rate limit exceeded or IP blocked', { status: 429 });
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};


