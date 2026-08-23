'use server';

import { requireTenantMember } from '@/lib/auth/utils';
import { db, withTenant } from '@/lib/db';
import { candidates } from '@/lib/db/schema';
import { inngest } from './client';
import { eq } from 'drizzle-orm';
import { logAudit } from '@/lib/db/audit';

import zlib from 'zlib';

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

  // Strategy 2: Decompress FlateDecode streams from PDF buffer
  try {
    const str = buffer.toString('binary');
    const streamRegex = /stream[\r\n]+([\s\S]*?)[\r\n]+endstream/g;
    let match: RegExpExecArray | null;
    let decompressedText = '';

    while ((match = streamRegex.exec(str)) !== null) {
      const rawStream = Buffer.from(match[1], 'binary');
      try {
        const decompressed = zlib.inflateSync(rawStream).toString('latin1');
        const textMatches = decompressed.match(/\(([^()]+)\)\s*Tj/g) || decompressed.match(/\[(.*?)\]\s*TJ/g);
        if (textMatches) {
          decompressedText += ' ' + textMatches.map(m => m.replace(/[()\[\]]/g, '').replace(/Tj|TJ/g, '').trim()).join(' ');
        }
      } catch {
        // Not a standard flate stream, continue
      }
    }

    if (decompressedText.trim().length > 0) {
      return decompressedText.trim();
    }
  } catch (err) {
    console.warn("[PDF] Flate decompress fallback failed:", err);
  }

  // Strategy 3: Direct text stream extraction
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

    // Strategy 4: Printable ASCII / Latin text extraction
    const printable = raw.replace(/[^\x20-\x7E\n\r\t]/g, ' ').replace(/\s+/g, ' ').trim();
    if (printable.length > 50) {
      return printable;
    }
  } catch (err) {
    console.error("[PDF] Text stream fallback failed:", err);
  }

  return "";
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
      matchReasoning: profile.matchReasoning,
      resumeUrl: documentUrl,
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
        documentUrl: documentUrl,
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
