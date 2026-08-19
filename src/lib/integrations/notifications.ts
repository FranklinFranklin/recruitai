import { db } from '@/lib/db';
import { tenantSettings, securityEvents } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export type SlackChannel = '#recruiter-ai-recruiter' | '#recruiter-ai-mngr' | '#recruiter-ai-Alert';
export type TeamsChannel = 'Recruitment / General' | 'Management / Approvals' | 'IT / Alerts';

// Strictly allowlisted domains for SSRF protection
const ALLOWED_WEBHOOK_DOMAINS = [
  'hooks.slack.com',
  'webhook.office.com'
];

/**
 * Validates a webhook URL against SSRF and internal IP risks.
 */
function isValidWebhookUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') return false;
    
    // Check against strict allowlist
    const isAllowed = ALLOWED_WEBHOOK_DOMAINS.some(domain => parsed.hostname.endsWith(domain));
    if (!isAllowed) return false;

    return true;
  } catch (e) {
    return false;
  }
}

async function logSecurityEvent(tenantId: string | null, type: string, details: string) {
  await db.insert(securityEvents).values({
    tenantId: tenantId,
    eventType: type,
    severity: 'HIGH',
    details: details,
  });
}

export async function sendSlackNotification(tenantId: string | null, channel: SlackChannel, message: string, metadata?: any) {
  if (!tenantId) return false;
  
  const settings = await db.query.tenantSettings.findFirst({
    where: eq(tenantSettings.tenantId, tenantId)
  });
  
  const url = settings?.slackWebhookUrl;
  if (!url) return false; // Not configured

  if (!isValidWebhookUrl(url)) {
    await logSecurityEvent(tenantId, 'SSRF_BLOCKED', `Blocked illegal Slack webhook URL attempt: ${url}`);
    return false;
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `*${channel}*\n${message}\n${metadata ? '```' + JSON.stringify(metadata, null, 2) + '```' : ''}`
      })
    });
    
    if (!response.ok) {
      await logSecurityEvent(tenantId, 'WEBHOOK_FAILED', `Slack webhook failed with status: ${response.status}`);
      return false;
    }
    return true;
  } catch (error: any) {
    await logSecurityEvent(tenantId, 'WEBHOOK_ERROR', `Slack webhook threw error: ${error.message}`);
    return false;
  }
}

export async function sendTeamsNotification(tenantId: string | null, channel: TeamsChannel, message: string, metadata?: any) {
  if (!tenantId) return false;
  
  const settings = await db.query.tenantSettings.findFirst({
    where: eq(tenantSettings.tenantId, tenantId)
  });
  
  const url = settings?.teamsWebhookUrl;
  if (!url) return false;

  if (!isValidWebhookUrl(url)) {
    await logSecurityEvent(tenantId, 'SSRF_BLOCKED', `Blocked illegal Teams webhook URL attempt: ${url}`);
    return false;
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `**${channel}**\n\n${message}\n\n${metadata ? '\`\`\`json\n' + JSON.stringify(metadata, null, 2) + '\n\`\`\`' : ''}`
      })
    });
    
    if (!response.ok) {
      await logSecurityEvent(tenantId, 'WEBHOOK_FAILED', `Teams webhook failed with status: ${response.status}`);
      return false;
    }
    return true;
  } catch (error: any) {
    await logSecurityEvent(tenantId, 'WEBHOOK_ERROR', `Teams webhook threw error: ${error.message}`);
    return false;
  }
}

export async function notifyRecruiter(tenantId: string, message: string, metadata?: any) {
  await Promise.all([
    sendSlackNotification(tenantId, '#recruiter-ai-recruiter', message, metadata),
    sendTeamsNotification(tenantId, 'Recruitment / General', message, metadata)
  ]);
  return true;
}

export async function notifyManager(tenantId: string, message: string, metadata?: any) {
  await Promise.all([
    sendSlackNotification(tenantId, '#recruiter-ai-mngr', message, metadata),
    sendTeamsNotification(tenantId, 'Management / Approvals', message, metadata)
  ]);
  return true;
}

export async function notifyAdminError(tenantId: string | null, error: Error | string, metadata?: any) {
  const errorMessage = typeof error === 'string' ? error : error.message;
  const formattedMessage = `🚨 SYSTEM ERROR: ${errorMessage}`;
  await Promise.all([
    sendSlackNotification(tenantId, '#recruiter-ai-Alert', formattedMessage, metadata),
    sendTeamsNotification(tenantId, 'IT / Alerts', formattedMessage, metadata)
  ]);
  return true;
}
