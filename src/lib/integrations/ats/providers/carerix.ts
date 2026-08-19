import { ATSIntegration } from '../factory';

export class CarerixProvider implements ATSIntegration {
  private token: string;
  private endpoint: string;

  constructor(token: string, endpoint: string = 'https://api.carerix.com/rest/v1/') {
    this.token = token;
    this.endpoint = endpoint;
  }

  async createCandidate(tenantId: string, candidateData: any) {
    console.log(`[Carerix ATS] Attempting to export candidate ${candidateData.firstName} ${candidateData.lastName}`);
    
    try {
      const url = `${this.endpoint}CRCandidate`;
      
      const payload = {
        firstName: candidateData.firstName,
        lastName: candidateData.lastName,
        emailAddresses: [
          {
            emailAddress: candidateData.email || `${candidateData.firstName.toLowerCase()}@example.com`,
            isPrimary: true
          }
        ],
        keywords: (candidateData.skills || []).join(', '),
      };

      if (this.token === 'mock' || !this.token) {
        console.warn('[Carerix ATS] Mock token detected. Simulating successful export.');
        await new Promise(resolve => setTimeout(resolve, 800));
        return { success: true, externalId: `CX-${Date.now()}` };
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
        throw new Error(`Carerix API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      return { 
        success: true, 
        externalId: data.id?.toString() || `CX-${Date.now()}` 
      };

    } catch (error: any) {
      console.error(`[Carerix ATS] Export failed:`, error);
      return { success: false, error: error.message };
    }
  }
}
