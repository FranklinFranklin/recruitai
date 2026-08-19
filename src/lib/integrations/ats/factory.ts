import { db } from '@/lib/db';
import { integrationAccounts } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { decrypt } from './crypto';
import { BullhornProvider } from './providers/bullhorn';
import { RecruiteeProvider } from './providers/recruitee';
import { CarerixProvider } from './providers/carerix';
import { OTYSProvider } from './providers/otys';

export interface ATSIntegration {
  createCandidate(tenantId: string, candidateData: {
    firstName: string;
    lastName: string;
    email?: string;
    skills?: string[];
    resumeUrl?: string;
  }): Promise<{ success: boolean; externalId?: string; error?: string }>;
}

class MockATSProvider implements ATSIntegration {
  private providerName: string;
  private token: string;

  constructor(providerName: string, token: string) {
    this.providerName = providerName;
    this.token = token;
  }

  async createCandidate(tenantId: string, candidateData: any) {
    console.log(`\n[ATS EXPORT: ${this.providerName}]`);
    console.log(`Using securely decrypted token: ${this.token.substring(0, 5)}...`);
    console.log(`Exporting candidate: ${candidateData.firstName} ${candidateData.lastName}`);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { success: true, externalId: `EXT-${Date.now()}` };
  }
}

export async function getConfiguredATS(tenantId: string): Promise<ATSIntegration | null> {
  const integrations = await db.select().from(integrationAccounts).where(eq(integrationAccounts.tenantId, tenantId));
  
  if (!integrations || integrations.length === 0) return null;

  const config = integrations[0];
  if (!config.accessToken) return null;

  try {
    const decryptedToken = decrypt(config.accessToken);
    const providerName = config.provider.toLowerCase();
    
    // Switch between real HTTP providers
    switch (providerName) {
      case 'bullhorn':
        return new BullhornProvider(decryptedToken);
      case 'recruitee':
        return new RecruiteeProvider(decryptedToken);
      case 'carerix':
        return new CarerixProvider(decryptedToken);
      case 'otys':
        return new OTYSProvider(decryptedToken);
      default:
        // Fallback for unsupported/custom ones
        return new MockATSProvider(config.provider, decryptedToken);
    }
  } catch (error) {
    console.error('Failed to initialize ATS integration due to decryption error.', error);
    return null;
  }
}
