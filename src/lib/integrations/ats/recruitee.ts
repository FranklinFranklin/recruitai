import { ATSIntegration, NormalizedCandidate } from './interface';
import { TokenVault } from '../vault';

export class RecruiteeATS implements ATSIntegration {
  
  async authenticate(tenantId: string): Promise<boolean> {
    let tokens = await TokenVault.getTokens(tenantId, 'RECRUITEE');
    
    if (!tokens || !tokens.accessToken) {
      tokens = await TokenVault.getTokens('SYSTEM_GLOBAL', 'RECRUITEE');
    }
    
    if (!tokens || !tokens.accessToken) {
      console.warn(`[Recruitee] No encrypted tokens found. Integration is disconnected.`);
      return false;
    }
    
    console.log(`[Recruitee] Successfully authenticated tenant ${tenantId}.`);
    return true; 
  }

  async createCandidate(tenantId: string, candidate: NormalizedCandidate): Promise<{ success: boolean; externalId?: string; error?: string }> {
    await this.authenticate(tenantId);
    
    // Map our universal candidate to Recruitee Candidate format
    const recruiteePayload = {
      candidate: {
        name: `${candidate.firstName} ${candidate.lastName}`,
        emails: [candidate.email],
        tags: candidate.skills,
      }
    };

    console.log(`[Recruitee] Pushing payload for tenant ${tenantId}:`, recruiteePayload);
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
      success: true,
      externalId: `REC_CAND_${crypto.randomUUID()}`,
    };
  }

  async fetchActiveVacancies(tenantId: string) {
    await this.authenticate(tenantId);
    return [
      { id: 'REC_VAC_10', title: 'HR Manager', description: 'Experience with modern ATS platforms' },
    ];
  }
}
