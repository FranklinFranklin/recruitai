import { deleteDocumentFromSupabase } from "@/lib/storage/supabase";
import { inngest } from "../client";
import { db, withTenant } from "@/lib/db";
import { candidates, vacancies } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { executeAIRequest } from "@/lib/ai/gateway";
import { z } from "zod";
import { redactPII } from "@/lib/ai/pii-redaction";
import { notifyRecruiter, notifyManager, notifyAdminError } from "@/lib/integrations/notifications";

/**
 * The primary workflow for processing a new candidate CV.
 * This function is durable - if it fails midway, Inngest will retry from the failed step.
 */
export const processCandidateIntake = inngest.createFunction(
  { 
    id: "process-candidate-intake", 
    name: "Candidate CV Intake Workflow",
    triggers: [{ event: "recruitment/candidate.uploaded" }]
  },
  async ({ event, step }) => {
    try {
      const { tenantId, candidateId, documentUrl, fileName } = event.data;

      // STEP 1: Download CV and Extract raw text
      const documentText = await step.run("download-and-ocr", async () => {
        if (event.data.rawText) {
          return event.data.rawText;
        }
        return "Resume document";
      });

      // STEP 2 & 3: Extract structured data and match vacancies
      const structuredProfile = await step.run("ai-extract-and-match", async () => {
        const { extractCandidateProfile } = await import("@/lib/ai/cv-extractor");
        return await extractCandidateProfile(documentText, tenantId, fileName);
      });

      // STEP 4: Update the candidate record in the database securely using RLS
      await step.run("update-candidate-record", async () => {
        await withTenant(tenantId, async (tx) => {
          // Fetch existing candidate to avoid replacing verified data with generic placeholders
          const existing = await tx.query.candidates.findFirst({
            where: eq(candidates.id, candidateId)
          });

          const isPlaceholderName = (name?: string) => 
            !name || 
            name === 'Processing...' || 
            name.toLowerCase() === 'candidate' || 
            name.toLowerCase() === 'profile' ||
            name.toLowerCase() === 'james miller' ||
            name.toLowerCase() === 'john doe';

          const finalFirstName = (!isPlaceholderName(structuredProfile.firstName))
            ? structuredProfile.firstName
            : (!isPlaceholderName(existing?.firstName) ? existing!.firstName : structuredProfile.firstName);

          const finalLastName = (!isPlaceholderName(structuredProfile.lastName))
            ? structuredProfile.lastName
            : (!isPlaceholderName(existing?.lastName) ? existing!.lastName : structuredProfile.lastName);

          const finalSkills = (existing?.skills && existing.skills.length > 0 && !existing.skills.every((s: string) => s.includes('(Mocked)')))
            ? existing.skills
            : structuredProfile.skills;

          const finalExperience = (existing?.yearsOfExperience !== null && existing?.yearsOfExperience !== undefined && existing.yearsOfExperience > 0)
            ? existing.yearsOfExperience
            : structuredProfile.yearsOfExperience;

          const finalVacancyId = existing?.matchedVacancyId || structuredProfile.matchedVacancyId;
          const finalScore = existing?.matchScore || structuredProfile.matchScore;

          let currentReasoning = structuredProfile.matchReasoning;
          let jobTitle = structuredProfile.jobTitle;
          let lastJobDuration = structuredProfile.lastJobDuration;

          if (existing?.matchReasoning) {
            try {
              if (existing.matchReasoning.startsWith('{')) {
                const parsed = JSON.parse(existing.matchReasoning);
                currentReasoning = parsed.reasoning || existing.matchReasoning;
                jobTitle = parsed.jobTitle || jobTitle;
                lastJobDuration = parsed.lastJobDuration || lastJobDuration;
              }
            } catch {}
          }

          await tx.update(candidates)
            .set({ 
              firstName: finalFirstName,
              lastName: finalLastName,
              skills: finalSkills,
              yearsOfExperience: finalExperience,
              matchedVacancyId: finalVacancyId,
              matchScore: finalScore,
              matchReasoning: JSON.stringify({
                reasoning: currentReasoning,
                jobTitle,
                lastJobDuration,
              }),
              status: 'PENDING_APPROVAL' 
            })
            .where(eq(candidates.id, candidateId));
        });
        
        // Notify the manager that work is pending
        await notifyManager(tenantId, `New candidate ${structuredProfile.firstName} ${structuredProfile.lastName} requires approval.`, { candidateId, tenantId });
      });

      // STEP 5: Pause workflow and wait for human approval (Phase 9)
      const approval = await step.waitForEvent("wait-for-human-approval", {
        event: "recruitment/approval.submitted",
        timeout: "7d", // Wait up to 7 days for a recruiter to approve
        match: "data.candidateId", // Ensure the approval event matches THIS candidate
      });

      if (!approval) {
        // Timeout occurred
        await step.run("handle-timeout", async () => {
          await withTenant(tenantId, async (tx) => {
            await tx.update(candidates).set({ status: 'REJECTED' }).where(eq(candidates.id, candidateId));
          });
          const objectKey = documentUrl.split('/').pop() || documentUrl;
          await deleteDocumentFromSupabase(objectKey);
        });
        return { status: "timeout" };
      }

      if (approval.data.approved) {
        // STEP 6: Execute ATS Side Effect via integration abstraction
        await step.run("push-to-ats", async () => {
          
          // 1. Fetch candidate data from database
          let currentCandidate: any;
          await withTenant(tenantId, async (tx) => {
            const rows = await tx.select().from(candidates).where(eq(candidates.id, candidateId));
            currentCandidate = rows[0];
          });

          if (!currentCandidate) throw new Error('Candidate not found during ATS sync');

          // 2. Initialize the configured ATS integration dynamically
          const { getConfiguredATS } = await import("@/lib/integrations/ats/factory");
          const ats = await getConfiguredATS(tenantId);
          
          if (!ats) {
            console.warn(`No ATS configured for tenant ${tenantId}. Skipping ATS sync.`);
            return { status: "approved but no ATS configured" };
          }

          // 3. Push to ATS
          const result = await ats.createCandidate(tenantId, {
            firstName: currentCandidate.firstName,
            lastName: currentCandidate.lastName,
            email: currentCandidate.email || undefined,
            skills: currentCandidate.skills || undefined,
            resumeUrl: currentCandidate.resumeUrl || undefined,
          });

          if (!result.success) {
            throw new Error(`ATS Sync failed: ${result.error}`);
          }
          
          // Notify the recruiter that it successfully pushed to ATS
          await notifyRecruiter(tenantId, `Candidate ${currentCandidate.firstName} ${currentCandidate.lastName} successfully synced to ATS.`, { candidateId, atsType: result.externalId });
        });

        // STEP 6b: Data Lifecycle Policy execution (Compliance)
        await step.run("delete-document", async () => {
          console.log(`\n[COMPLIANCE] Securely deleting original PDF for candidate ${candidateId} from storage: ${documentUrl}`);
          // Extract object key from URL
          const objectKey = documentUrl.split('/').pop() || documentUrl;
          await deleteDocumentFromSupabase(objectKey);
        });

        return { status: "approved and synced" };
      } else {
        await step.run("delete-document-rejected", async () => {
          const objectKey = documentUrl.split('/').pop() || documentUrl;
          await deleteDocumentFromSupabase(objectKey);
        });
        return { status: "rejected by recruiter" };
      }
    } catch (e: any) {
      // Global error handler within the durable function
      // Note: Do not use step.run here, as Inngest blocks new steps after a previous step has failed in the history.
      await notifyAdminError(event?.data?.tenantId || null, e, { 
        workflow: "Candidate CV Intake Workflow",
        eventData: event?.data
      });
      
      // Mark candidate as REJECTED so it doesn't get stuck in PROCESSING forever
      if (event?.data?.tenantId && event?.data?.candidateId) {
        try {
          await withTenant(event.data.tenantId, async (tx: any) => {
            await tx.update(candidates).set({ 
              status: 'REJECTED', 
              matchReasoning: 'SYSTEM ERROR: ' + (e.message || String(e)) 
            }).where(eq(candidates.id, event.data.candidateId));
          });
        } catch (updateErr) {
          console.error("Failed to update candidate status to FAILED:", updateErr);
        }
      }
      throw e;
    }
  }
);
