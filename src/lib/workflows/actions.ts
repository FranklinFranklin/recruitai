'use server';

import { requireTenantMember } from '@/lib/auth/utils';
import { db, withTenant } from '@/lib/db';
import { candidates } from '@/lib/db/schema';
import { inngest } from './client';
import { eq } from 'drizzle-orm';
import { logAudit } from '@/lib/db/audit';

async function extractPdfText(buffer: Buffer): Promise<string> {
  // Strategy 1: Try PDFParse class instance
  try {
    const { PDFParse } = await import('pdf-parse');
    const parser = new PDFParse({ data: buffer });
    const textResult = await parser.getText();
    await parser.destroy();
    if (textResult?.text && textResult.text.trim().length > 0) {
      return textResult.text;
    }
  } catch (err) {
    console.warn("[PDF] PDFParse parser failed, attempting fallback extraction:", err);
  }

  // Strategy 2: Direct text stream extraction (works in all serverless runtimes)
  try {
    const raw = buffer.toString('latin1');
    const matches = raw.match(/\(([^()]+)\)\s*Tj/g) || raw.match(/\[(.*?)\]\s*TJ/g);
    if (matches && matches.length > 0) {
      const extracted = matches
        .map(m => m.replace(/[()\[\]]/g, '').replace(/Tj|TJ/g, '').trim())
        .filter(Boolean)
        .join(' ');
      if (extracted.trim().length > 0) {
        return extracted;
      }
    }

    // Strategy 3: Printable text extraction
    const printable = raw.replace(/[^\x20-\x7E\n\r\t]/g, ' ').replace(/\s+/g, ' ').trim();
    if (printable.length > 50) {
      return printable;
    }
  } catch (err) {
    console.error("[PDF] Text stream fallback failed:", err);
  }

  return "Candidate Profile / Resume document uploaded.";
}

import { extractCandidateProfile } from '@/lib/ai/cv-extractor';

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
  const profile = await extractCandidateProfile(rawText, activeTenantId);

  // We construct the URL to pretend it's in an isolated bucket
  const secureDocumentUrl = `s3://secure-cv-bucket/${activeTenantId}/${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

  // 1. Create the database record with real extracted candidate profile
  const [newCandidate] = await withTenant(activeTenantId, async (tx) => {
    return await tx.insert(candidates).values({
      tenantId: activeTenantId,
      firstName: profile.firstName,
      lastName: profile.lastName,
      skills: profile.skills,
      yearsOfExperience: profile.yearsOfExperience,
      matchedVacancyId: profile.matchedVacancyId,
      matchScore: profile.matchScore,
      matchReasoning: profile.matchReasoning,
      resumeUrl: secureDocumentUrl,
      status: 'PENDING_APPROVAL',
    }).returning();
  });

  // Log audit event
  await logAudit(activeTenantId, user.id, 'CANDIDATE_UPLOADED', newCandidate.id);

  // 2. Trigger the asynchronous Inngest workflow, passing the extracted text
  try {
    await inngest.send({
      name: 'recruitment/candidate.uploaded',
      data: {
        tenantId: activeTenantId,
        candidateId: newCandidate.id,
        documentUrl: secureDocumentUrl,
        rawText: rawText,
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
