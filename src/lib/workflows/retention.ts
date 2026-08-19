import { db } from '@/lib/db';
import { candidates, auditLogs } from '@/lib/db/schema';
import { lte, eq, and } from 'drizzle-orm';
import { inngest } from './client';

/**
 * Inngest workflow that runs daily to anonymize old candidate data.
 * Purges PII from candidates exported more than 30 days ago.
 */
export const anonymizeOldCandidates = (inngest.createFunction as any)(
  { id: 'anonymize-old-candidates', name: 'GDPR: Anonymize Old Candidates' },
  { cron: '0 2 * * *' }, // Run daily at 2 AM
  async ({ step }: any) => {
    
    await step.run('anonymize-db-records', async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Find candidates that were exported to ATS > 30 days ago.
      // We assume status 'EXPORTED' or similar marks completion.
      const oldCandidates = await db.select({ id: candidates.id, tenantId: candidates.tenantId })
        .from(candidates)
        .where(
          and(
            eq(candidates.status, 'EXPORTED'),
            lte(candidates.createdAt, thirtyDaysAgo)
          )
        );

      for (const candidate of oldCandidates) {
        // Overwrite PII fields
        await db.update(candidates)
          .set({
            firstName: 'REDACTED',
            lastName: 'REDACTED',
            email: 'redacted@privacy.local',
            resumeUrl: null, // Remove link to the document
          })
          .where(eq(candidates.id, candidate.id));

        // Create an audit log record
        await db.insert(auditLogs).values({
          tenantId: candidate.tenantId,
          action: 'CANDIDATE_ANONYMIZED',
          resourceId: candidate.id,
          details: 'Candidate PII purged automatically per 30-day retention policy.',
        });
      }
      
      return { count: oldCandidates.length };
    });
  }
);
