import { ATSIntegration } from '../factory';

export class RecruiteeProvider implements ATSIntegration {
  private token: string;
  private companyId: string;
  private endpoint: string;

  constructor(token: string, companyId: string = 'demo-company') {
    this.token = token;
    this.companyId = companyId;
    this.endpoint = `https://api.recruitee.com/c/${this.companyId}/candidates`;
  }

  async createCandidate(tenantId: string, candidateData: any) {
    console.log(`[Recruitee ATS] Attempting to export candidate ${candidateData.firstName} ${candidateData.lastName}`);
    
    try {
      const payload = {
        candidate: {
          name: `${candidateData.firstName} ${candidateData.lastName}`,
          emails: [candidateData.email || `${candidateData.firstName.toLowerCase()}@example.com`],
          custom_fields: {
            skills: (candidateData.skills || []).join(', ')
          }
        }
      };

      if (this.token === 'mock' || !this.token) {
        console.warn('[Recruitee ATS] Mock token detected. Simulating successful export.');
        await new Promise(resolve => setTimeout(resolve, 600));
        return { success: true, externalId: `REC-${Date.now()}` };
      }

      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Recruitee API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      return { 
        success: true, 
        externalId: data.candidate?.id?.toString() || `REC-${Date.now()}` 
      };

    } catch (error: any) {
      console.error(`[Recruitee ATS] Export failed:`, error);
      return { success: false, error: error.message };
    }
  }
}
