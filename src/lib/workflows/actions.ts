'use server';

import { requireTenantMember } from '@/lib/auth/utils';
import { db, withTenant } from '@/lib/db';
import { candidates } from '@/lib/db/schema';
import { inngest } from './client';
import { eq } from 'drizzle-orm';
import { logAudit } from '@/lib/db/audit';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdf = require('pdf-parse');

export async function uploadCandidateCV(formData: FormData) {
  const { activeTenantId, user } = await requireTenantMember();
  
  const file = formData.get('cv_file') as File;
  
  if (!file) {
    throw new Error('No file uploaded.');
  }

  if (file.type !== 'application/pdf') {
    throw new Error('Invalid file format. Only PDF is allowed.');
  }

  // Parse PDF in memory
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  
  let rawText = '';
  try {
    const pdfData = await pdf(buffer);
    rawText = pdfData.text;
  } catch (err) {
    console.error("Failed to parse PDF:", err);
    throw new Error("Failed to extract text from PDF");
  }

  // We construct the URL to pretend it's in an isolated bucket
  const secureDocumentUrl = `s3://secure-cv-bucket/${activeTenantId}/${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

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

  // 2. Trigger the asynchronous Inngest workflow, passing the extracted text
  await inngest.send({
    name: 'recruitment/candidate.uploaded',
    data: {
      tenantId: activeTenantId,
      candidateId: newCandidate.id,
      documentUrl: secureDocumentUrl,
      rawText: rawText,
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
