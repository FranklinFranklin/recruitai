/**
 * The standard contract for all external Applicant Tracking Systems.
 * The core application must NEVER depend on Bullhorn/Recruitee specific types.
 */

export interface NormalizedCandidate {
  firstName: string;
  lastName: string;
  email?: string;
  skills?: string[];
  resumeUrl?: string;
}

export interface ATSIntegration {
  /**
   * Initializes the OAuth handshake or API key connection
   */
  authenticate(tenantId: string): Promise<boolean>;

  /**
   * Pushes a successfully approved candidate to the ATS
   */
  createCandidate(tenantId: string, candidate: NormalizedCandidate): Promise<{ success: boolean; externalId?: string; error?: string }>;

  /**
   * Fetches active vacancies for the AI to match against
   */
  fetchActiveVacancies(tenantId: string): Promise<Array<{ id: string; title: string; description: string }>>;
}
