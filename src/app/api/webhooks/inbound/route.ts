import { NextResponse } from 'next/server';
import { db, withTenant } from '@/lib/db';
import { tenantSettings, candidates, securityEvents } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';
import { inngest } from '@/lib/workflows/client';
import arcjet, { tokenBucket } from '@arcjet/next';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Configure Arcjet rate limiting
const aj = arcjet({
  key: process.env.ARCJET_KEY || 'aj_mock_123', // Get from Arcjet dashboard
  characteristics: ['ip.src'], // Rate limit by IP
  rules: [
    tokenBucket({
      mode: process.env.ARCJET_KEY ? 'LIVE' : 'DRY_RUN', // Run in DRY_RUN if mock key
      refillRate: 5, // 5 requests per minute allowed
      interval: 60,
      capacity: 10, // Max burst
    }),
  ],
});

async function logSecurityEvent(tenantId: string | null, type: string, details: string) {
  try {
    await db.insert(securityEvents).values({
      tenantId: tenantId,
      eventType: type,
      severity: 'HIGH',
      details: details,
    });
  } catch (e) {
    console.error("Failed to log security event", e);
  }
}

export async function POST(request: Request) {
  // Arcjet API Security Check (Phase 2 Remediation)
  const decision = await aj.protect(request, { requested: 1 });
  if (decision.isDenied()) {
    console.warn('[Arcjet WAF] Request blocked due to rate limits');
    await logSecurityEvent(null, 'INBOUND_RATE_LIMIT_EXCEEDED', `IP rate limited by Arcjet`);
    return NextResponse.json({ error: "Too Many Requests" }, { status: 429 });
  }

  try {
    // 1. API Key Validation
    const apiKey = request.headers.get('X-Tenant-API-Key');
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing X-Tenant-API-Key header' }, { status: 401 });
    }

    const apiKeyHash = crypto.createHash('sha256').update(apiKey).digest('hex');
    
    // Find the tenant with this hashed key
    const settings = await db.query.tenantSettings.findFirst({
      where: eq(tenantSettings.inboundApiKeyHash, apiKeyHash)
    });

    if (!settings || !settings.tenantId) {
      await logSecurityEvent(null, 'INBOUND_AUTH_FAILED', `Invalid API Key attempt: ${apiKey.substring(0, 5)}...`);
      return NextResponse.json({ error: 'Invalid API Key' }, { status: 401 });
    }

    const tenantId = settings.tenantId;

    // 2. Parse FormData
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      await logSecurityEvent(tenantId, 'INBOUND_MISSING_FILE', `Request received without file payload`);
      return NextResponse.json({ error: 'Missing file payload in form-data' }, { status: 400 });
    }

    // 3. File Validation (Size and Magic Bytes / MIME)
    if (file.size > MAX_FILE_SIZE) {
      await logSecurityEvent(tenantId, 'INBOUND_FILE_TOO_LARGE', `Rejected file of size ${file.size} bytes`);
      return NextResponse.json({ error: 'File exceeds 10MB limit' }, { status: 413 });
    }

    if (file.type !== 'application/pdf') {
      await logSecurityEvent(tenantId, 'INBOUND_INVALID_MIME', `Rejected file with MIME type ${file.type}`);
      return NextResponse.json({ error: 'Only PDF files are allowed' }, { status: 415 });
    }

    // Verify PDF Magic Bytes (%PDF-)
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    if (buffer.length < 5 || buffer.toString('utf8', 0, 5) !== '%PDF-') {
      await logSecurityEvent(tenantId, 'INBOUND_MAGIC_BYTES_FAILED', 'File MIME was application/pdf but magic bytes did not match %PDF-');
      return NextResponse.json({ error: 'Invalid PDF file structure' }, { status: 415 });
    }

    // 4. Mock Secure Upload
    // In a real 2026 app, we would pipe this to an S3 bucket here via a presigned URL or direct AWS SDK.
    // We mock this by generating a random key.
    const objectKey = `${crypto.randomUUID()}.pdf`;
    const secureDocumentUrl = `supabase://storage/cv-uploads/${tenantId}/${objectKey}`;

    // 5. Database Record Creation (using RLS)
    const [newCandidate] = await withTenant(tenantId, async (tx) => {
      return await tx.insert(candidates).values({
        tenantId: tenantId,
        firstName: 'Inbound...', // Will be updated by AI
        lastName: 'Processing...',
        resumeUrl: secureDocumentUrl,
        status: 'PROCESSING',
      }).returning();
    });

    // 6. Trigger Durable Inngest Workflow
    await inngest.send({
      name: 'recruitment/candidate.uploaded',
      data: {
        tenantId: tenantId,
        candidateId: newCandidate.id,
        documentUrl: secureDocumentUrl,
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Candidate uploaded successfully and queued for AI extraction',
      candidateId: newCandidate.id 
    }, { status: 202 });

  } catch (error: any) {
    console.error('Inbound Webhook Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
