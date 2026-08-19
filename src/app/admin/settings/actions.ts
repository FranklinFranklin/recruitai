'use server';

import { requireSystemAdmin } from '@/lib/auth/utils';
import { TokenVault } from '@/lib/integrations/vault';

export async function saveIntegrationKeys(keys: {
  openAiKey?: string;
  atsProvider?: string;
  atsKey?: string;
  slackKey?: string;
  teamsKey?: string;
}) {
  // Only System Admins can save global integrations
  await requireSystemAdmin({ requireWriteAccess: true });

  // For this MVP, we treat 'SYSTEM_GLOBAL' as the tenant ID for global keys
  const GLOBAL_TENANT = 'SYSTEM_GLOBAL';

  if (keys.openAiKey) {
    await TokenVault.saveTokens(GLOBAL_TENANT, 'OPENAI', {
      accessToken: keys.openAiKey,
    });
  }

  if (keys.atsProvider && keys.atsKey) {
    await TokenVault.saveTokens(GLOBAL_TENANT, keys.atsProvider, {
      accessToken: keys.atsKey,
    });
  }

  if (keys.slackKey) {
    await TokenVault.saveTokens(GLOBAL_TENANT, 'SLACK', {
      accessToken: keys.slackKey,
    });
  }

  if (keys.teamsKey) {
    await TokenVault.saveTokens(GLOBAL_TENANT, 'TEAMS', {
      accessToken: keys.teamsKey,
    });
  }

  return { success: true };
}
