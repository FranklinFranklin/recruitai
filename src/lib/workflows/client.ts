import { Inngest } from "inngest";

// Define the event payloads our application will emit
type Events = {
  "recruitment/candidate.uploaded": {
    data: {
      tenantId: string;
      candidateId: string;
      documentUrl: string;
      rawText?: string;
    };
  };
  "recruitment/approval.submitted": {
    data: {
      tenantId: string;
      candidateId: string;
      approved: boolean;
      notes?: string;
    };
  };
};

// Create a client to send and receive events
export const inngest = new Inngest({ id: "recruit-ai-platform" });
