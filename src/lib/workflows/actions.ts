'use server';

import { requireTenantMember } from '@/lib/auth/utils';
import { db, withTenant } from '@/lib/db';
import { candidates } from '@/lib/db/schema';
import { inngest } from './client';
import { eq } from 'drizzle-orm';
import { logAudit } from '@/lib/db/audit';

import { extractPdfText, extractCandidateProfile } from '@/lib/ai/cv-extractor';

export async function uploadCandidateCV(formData: FormData) {
  const { activeTenantId, user } = await requireTenantMember();
  
  const file = formData.get('cv_file') as File;
  
  if (!file) {
    throw new Error('No file uploaded.');
  }

  if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
    throw new Error('Invalid file format. Only PDF is allowed.');
  }

  // Parse PDF in memory
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  
  const rawText = await extractPdfText(buffer);
  const profile = await extractCandidateProfile(rawText, activeTenantId, file.name);

  // Store real PDF as data URL so the recruiter can preview and download the exact original document
  const base64Doc = buffer.toString('base64');
  const documentUrl = `data:application/pdf;base64,${base64Doc}`;

  // 1. Create the database record with real extracted candidate profile and document preview
  const [newCandidate] = await withTenant(activeTenantId, async (tx) => {
    return await tx.insert(candidates).values({
      tenantId: activeTenantId,
      firstName: profile.firstName,
      lastName: profile.lastName,
      skills: profile.skills,
      yearsOfExperience: profile.yearsOfExperience,
      matchedVacancyId: profile.matchedVacancyId,
      matchScore: profile.matchScore,
      matchReasoning: JSON.stringify({
        reasoning: profile.matchReasoning,
        jobTitle: profile.jobTitle,
        lastJobDuration: profile.lastJobDuration,
      }),
      resumeUrl: documentUrl,
      status: 'PENDING_APPROVAL',
    }).returning();
  });

  // Log audit event
  await logAudit(activeTenantId, user.id, 'CANDIDATE_UPLOADED', newCandidate.id);

  // 2. Trigger the asynchronous Inngest workflow, passing the extracted text and original filename
  try {
    await inngest.send({
      name: 'recruitment/candidate.uploaded',
      data: {
        tenantId: activeTenantId,
        candidateId: newCandidate.id,
        documentUrl: documentUrl,
        rawText: rawText,
        fileName: file.name,
      }
    });
  } catch (inngestErr) {
    console.warn("Inngest event dispatch skipped/offline:", inngestErr);
  }

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

export async function updateCandidateData(candidateId: string, updates: { 
  firstName: string; 
  lastName: string; 
  jobTitle?: string;
  lastJobDuration?: string;
  skills: string[]; 
  yearsOfExperience: number; 
  matchedVacancyId: string 
}) {
  const { activeTenantId, user } = await requireTenantMember();

  await withTenant(activeTenantId, async (tx) => {
    const existing = await tx.query.candidates.findFirst({
      where: eq(candidates.id, candidateId)
    });

    let currentReasoning = 'Candidate data updated.';
    if (existing?.matchReasoning) {
      try {
        if (existing.matchReasoning.startsWith('{')) {
          const parsed = JSON.parse(existing.matchReasoning);
          currentReasoning = parsed.reasoning || existing.matchReasoning;
        } else {
          currentReasoning = existing.matchReasoning;
        }
      } catch {}
    }

    await tx.update(candidates)
      .set({
        firstName: updates.firstName,
        lastName: updates.lastName,
        skills: updates.skills,
        yearsOfExperience: updates.yearsOfExperience,
        matchedVacancyId: updates.matchedVacancyId,
        matchReasoning: JSON.stringify({
          reasoning: currentReasoning,
          jobTitle: updates.jobTitle,
          lastJobDuration: updates.lastJobDuration,
        }),
      })
      .where(eq(candidates.id, candidateId));
  });

  await logAudit(activeTenantId, user.id, 'CANDIDATE_DATA_EDITED', candidateId);
  return { success: true };
}
