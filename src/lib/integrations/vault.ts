import { db, withTenant } from '@/lib/db';
import { integrationAccounts } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { encryptToken, decryptToken } from '@/lib/security/encryption';

interface TokenPayload {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
}

/**
 * Secure Token Vault
 * Handles storing and retrieving Third-Party Integration tokens (e.g., ATS OAuth tokens).
 * All tokens are encrypted at rest using AES-256-GCM.
 */
export const TokenVault = {
  
  async saveTokens(tenantId: string, provider: string, payload: TokenPayload) {
    // Encrypt sensitive tokens before they hit the database
    const encryptedAccessToken = encryptToken(payload.accessToken);
    const encryptedRefreshToken = payload.refreshToken ? encryptToken(payload.refreshToken) : undefined;

    await withTenant(tenantId, async (tx) => {
      // Check if credentials already exist for this provider
      const existing = await tx.select()
        .from(integrationAccounts)
        .where(
          and(
            eq(integrationAccounts.tenantId, tenantId),
            eq(integrationAccounts.provider, provider)
          )
        );

      if (existing.length > 0) {
        // Update existing
        await tx.update(integrationAccounts)
          .set({
            accessToken: encryptedAccessToken,
            refreshToken: encryptedRefreshToken,
            expiresAt: payload.expiresAt,
          })
          .where(eq(integrationAccounts.id, existing[0].id));
      } else {
        // Insert new
        await tx.insert(integrationAccounts).values({
          tenantId,
          provider,
          accessToken: encryptedAccessToken,
          refreshToken: encryptedRefreshToken,
          expiresAt: payload.expiresAt,
        });
      }
    });
  },

  async getTokens(tenantId: string, provider: string): Promise<TokenPayload | null> {
    let account: any;
    
    await withTenant(tenantId, async (tx) => {
      const results = await tx.select()
        .from(integrationAccounts)
        .where(
          and(
            eq(integrationAccounts.tenantId, tenantId),
            eq(integrationAccounts.provider, provider)
          )
        );
      account = results[0];
    });

    if (!account || !account.accessToken) return null;

    // Decrypt tokens in memory after fetching from the database
    return {
      accessToken: decryptToken(account.accessToken),
      refreshToken: account.refreshToken ? decryptToken(account.refreshToken) : undefined,
      expiresAt: account.expiresAt || undefined,
    };
  }
};
