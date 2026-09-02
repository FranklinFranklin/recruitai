export const maxDuration = 60; // Increase Vercel timeout for AI tasks
import { serve } from "inngest/next";
import { inngest } from "@/lib/workflows/client";
import { processCandidateIntake } from "@/lib/workflows/functions/candidate-intake";
import { syncAtsVacancies } from "@/lib/workflows/functions/sync-ats-vacancies";

// Expose our durable functions to the Inngest execution engine
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    processCandidateIntake,
    syncAtsVacancies,
  ],
});
