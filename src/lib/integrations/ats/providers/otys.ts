import { ATSIntegration } from '../factory';

export class OTYSProvider implements ATSIntegration {
  private token: string;
  private endpoint: string;

  constructor(token: string, endpoint: string = 'https://api.otys.nl/v1/') {
    this.token = token;
    this.endpoint = endpoint;
  }

  async createCandidate(tenantId: string, candidateData: any) {
    console.log(`[OTYS ATS] Attempting to export candidate ${candidateData.firstName} ${candidateData.lastName}`);
    
    try {
      const url = `${this.endpoint}candidates`;
      
      const payload = {
        candidate: {
          personal: {
            firstName: candidateData.firstName,
            lastName: candidateData.lastName,
            email: candidateData.email || `${candidateData.firstName.toLowerCase()}@example.com`,
          },
          skills: candidateData.skills || [],
          source: 'RecruitAI Automation'
        }
      };

      if (this.token === 'mock' || !this.token) {
        console.warn('[OTYS ATS] Mock token detected. Simulating successful export.');
        await new Promise(resolve => setTimeout(resolve, 700));
        return { success: true, externalId: `OTYS-${Date.now()}` };
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`OTYS API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      return { 
        success: true, 
        externalId: data.candidateId?.toString() || `OTYS-${Date.now()}` 
      };

    } catch (error: any) {
      console.error(`[OTYS ATS] Export failed:`, error);
      return { success: false, error: error.message };
    }
  }
}
