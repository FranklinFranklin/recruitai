import { ATSIntegration } from '../factory';

export class BullhornProvider implements ATSIntegration {
  private token: string;
  private endpoint: string;

  constructor(token: string, endpoint: string = 'https://rest.bullhornstaffing.com/rest-services/') {
    this.token = token;
    this.endpoint = endpoint;
  }

  async createCandidate(tenantId: string, candidateData: any) {
    console.log(`[Bullhorn ATS] Attempting to export candidate ${candidateData.firstName} ${candidateData.lastName}`);
    
    try {
      // In a real implementation, you would obtain a BhRestToken here first,
      // but we assume the token passed is the active REST token for this example.
      const url = `${this.endpoint}entity/Candidate?BhRestToken=${this.token}`;
      
      const payload = {
        firstName: candidateData.firstName,
        lastName: candidateData.lastName,
        email: candidateData.email || `${candidateData.firstName.toLowerCase()}@example.com`,
        status: 'New Lead',
        description: `Imported via RecruitAI.\nSkills: ${(candidateData.skills || []).join(', ')}`,
      };

      // Ensure we don't crash dev environments without real tokens
      if (this.token === 'mock' || !this.token) {
        console.warn('[Bullhorn ATS] Mock token detected. Simulating successful export.');
        await new Promise(resolve => setTimeout(resolve, 500));
        return { success: true, externalId: `BH-${Date.now()}` };
      }

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Bullhorn API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      return { 
        success: true, 
        externalId: data.changedEntityId?.toString() || `BH-${Date.now()}` 
      };

    } catch (error: any) {
      console.error(`[Bullhorn ATS] Export failed:`, error);
      return { success: false, error: error.message };
    }
  }
}
