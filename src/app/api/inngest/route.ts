import { serve } from "inngest/next";
import { inngest } from "@/lib/workflows/client";
import { processCandidateIntake } from "@/lib/workflows/functions/candidate-intake";

// Expose our durable functions to the Inngest execution engine
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    processCandidateIntake,
    // Add future workflows here (e.g., vacancy intake, CRM updates)
  ],
});
