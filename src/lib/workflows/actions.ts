'use server';

import { requireTenantMember } from '@/lib/auth/utils';
import { db, withTenant } from '@/lib/db';
import { candidates } from '@/lib/db/schema';
import { inngest } from './client';
import { eq } from 'drizzle-orm';
import { logAudit } from '@/lib/db/audit';

export async function uploadCandidateCV(formData: FormData) {
  const { activeTenantId, user } = await requireTenantMember();
  
  // SECURITY FIX: Never accept raw files directly on the Next.js server in production.
  // The client should request a presigned S3 URL and upload directly to an isolated bucket.
  // The backend should only receive the S3 Object Key from the client.
  const objectKey = formData.get('s3_object_key') as string;
  
  if (!objectKey || typeof objectKey !== 'string') {
    throw new Error('Invalid file reference. Client must upload to secure storage first.');
  }

  // Validate the object key matches expected UUID format to prevent path traversal
  if (!/^[a-zA-Z0-9-]+\.pdf$/.test(objectKey)) {
    throw new Error('Invalid file format. Only PDF is allowed.');
  }

  // We construct the URL. The Inngest worker will fetch this from the isolated bucket
  // AFTER the bucket's automated virus scanner (e.g., ClamAV Lambda) flags it as SAFE.
  const secureDocumentUrl = `s3://secure-cv-bucket/${activeTenantId}/${objectKey}`;

  // 1. Create the database record (tenant-isolated via RLS)
  const [newCandidate] = await withTenant(activeTenantId, async (tx) => {
    return await tx.insert(candidates).values({
      tenantId: activeTenantId,
      firstName: 'Processing...', // Will be updated by AI
      lastName: 'Processing...',
      resumeUrl: secureDocumentUrl,
      status: 'PROCESSING',
    }).returning();
  });

  // Log audit event
  await logAudit(activeTenantId, user.id, 'CANDIDATE_UPLOADED', newCandidate.id);

  // 2. Trigger the asynchronous Inngest workflow
  await inngest.send({
    name: 'recruitment/candidate.uploaded',
    data: {
      tenantId: activeTenantId,
      candidateId: newCandidate.id,
      documentUrl: secureDocumentUrl,
    }
  });

  return { success: true, candidateId: newCandidate.id };
}

export async function submitApproval(candidateId: string, approved: boolean, notes?: string) {
  const { activeTenantId, user } = await requireTenantMember();

  // 1. Update the candidate status in the DB
  await withTenant(activeTenantId, async (tx) => {
    await tx.update(candidates)
      .set({ status: approved ? 'APPROVED' : 'REJECTED' })
      .where(eq(candidates.id, candidateId));
  });

  // Log audit event
  await logAudit(activeTenantId, user.id, approved ? 'CANDIDATE_APPROVED' : 'CANDIDATE_REJECTED', candidateId, { notes });

  // 2. Resume the paused Inngest workflow by emitting the expected event
  await inngest.send({
    name: 'recruitment/approval.submitted',
    data: {
      tenantId: activeTenantId,
      candidateId: candidateId,
      approved,
      notes,
    }
  });

  return { success: true };
}

export async function updateCandidateData(candidateId: string, updates: { firstName: string; lastName: string; skills: string[]; yearsOfExperience: number; matchedVacancyId: string }) {
  const { activeTenantId, user } = await requireTenantMember();

  await withTenant(activeTenantId, async (tx) => {
    await tx.update(candidates)
      .set({
        firstName: updates.firstName,
        lastName: updates.lastName,
        skills: updates.skills,
        yearsOfExperience: updates.yearsOfExperience,
        matchedVacancyId: updates.matchedVacancyId,
      })
      .where(eq(candidates.id, candidateId));
  });

  await logAudit(activeTenantId, user.id, 'CANDIDATE_DATA_EDITED', candidateId);
  return { success: true };
}
