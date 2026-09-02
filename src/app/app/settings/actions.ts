'use server';

import { requireTenantMember } from '@/lib/auth/utils';
import { db } from '@/lib/db';
import { integrationAccounts } from '@/lib/db/schema';
import { encrypt } from '@/lib/integrations/ats/crypto';
import { eq } from 'drizzle-orm';

export async function connectAtsIntegration(provider: string, token: string) {
  const { activeTenantId, role } = await requireTenantMember();

  if (role !== 'TENANT_ADMIN') {
    throw new Error('Unauthorized');
  }

  if (!provider || !token) {
    throw new Error('Provider and token are required');
  }

  const encryptedToken = encrypt(token);

  const existing = await db.select().from(integrationAccounts).where(eq(integrationAccounts.tenantId, activeTenantId)).limit(1);

  if (existing.length > 0) {
    await db.update(integrationAccounts).set({
      provider: provider,
      accessToken: encryptedToken,
    }).where(eq(integrationAccounts.id, existing[0].id));
  } else {
    await db.insert(integrationAccounts).values({
      tenantId: activeTenantId,
      provider: provider,
      accessToken: encryptedToken,
    });
  }

  return { success: true };
}
