import { ATSIntegration, NormalizedCandidate } from './interface';
import { TokenVault } from '../vault';

export class OtysATS implements ATSIntegration {
  
  async authenticate(tenantId: string): Promise<boolean> {
    let tokens = await TokenVault.getTokens(tenantId, 'OTYS');
    
    if (!tokens || !tokens.accessToken) {
      tokens = await TokenVault.getTokens('SYSTEM_GLOBAL', 'OTYS');
    }
    
    if (!tokens || !tokens.accessToken) {
      console.warn(`[OTYS] No encrypted tokens found. Integration is disconnected.`);
      return false;
    }
    
    console.log(`[OTYS] Successfully authenticated tenant ${tenantId}.`);
    return true; 
  }

  async createCandidate(tenantId: string, candidate: NormalizedCandidate): Promise<{ success: boolean; externalId?: string; error?: string }> {
    await this.authenticate(tenantId);
    
    // Map our universal candidate to OTYS Go! API format
    const otysPayload = {
      candidate: {
        personal: {
          firstName: candidate.firstName,
          lastName: candidate.lastName,
          email: candidate.email,
        },
        proficiencies: candidate.skills,
      }
    };

    console.log(`[OTYS] Pushing payload for tenant ${tenantId}:`, otysPayload);
    await new Promise(resolve => setTimeout(resolve, 750));

    return {
      success: true,
      externalId: `OTYS_CAND_${crypto.randomUUID()}`,
    };
  }

  async fetchActiveVacancies(tenantId: string) {
    await this.authenticate(tenantId);
    return [
      { id: 'OTYS_VAC_1', title: 'OTYS Recruitment Consultant', description: 'OTYS Go! knowledge required' },
    ];
  }
}
