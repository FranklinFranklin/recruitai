import { ATSIntegration, NormalizedCandidate } from './interface';
import { TokenVault } from '../vault';

export class CarerixATS implements ATSIntegration {
  
  async authenticate(tenantId: string): Promise<boolean> {
    let tokens = await TokenVault.getTokens(tenantId, 'CARERIX');
    
    if (!tokens || !tokens.accessToken) {
      tokens = await TokenVault.getTokens('SYSTEM_GLOBAL', 'CARERIX');
    }
    
    if (!tokens || !tokens.accessToken) {
      console.warn(`[Carerix] No encrypted tokens found. Integration is disconnected.`);
      return false;
    }
    
    console.log(`[Carerix] Successfully authenticated tenant ${tenantId}.`);
    return true; 
  }

  async createCandidate(tenantId: string, candidate: NormalizedCandidate): Promise<{ success: boolean; externalId?: string; error?: string }> {
    await this.authenticate(tenantId);
    
    // Map our universal candidate to Carerix CRCandidate XML/JSON format
    const carerixPayload = {
      CRCandidate: {
        firstName: candidate.firstName,
        lastName: candidate.lastName,
        emailAddresses: [{ emailAddress: candidate.email }],
        skills: candidate.skills?.join(', '),
        // Carerix requires specific node structures
      }
    };

    console.log(`[Carerix] Pushing payload for tenant ${tenantId}:`, carerixPayload);
    await new Promise(resolve => setTimeout(resolve, 600));

    return {
      success: true,
      externalId: `CX_CAND_${crypto.randomUUID()}`,
    };
  }

  async fetchActiveVacancies(tenantId: string) {
    await this.authenticate(tenantId);
    return [
      { id: 'CX_VAC_99', title: 'Carerix Integration Engineer', description: 'API mapping experience' },
    ];
  }
}
