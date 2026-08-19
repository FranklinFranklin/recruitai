import { db, withTenant } from './index';
import { auditLogs, securityEvents } from './schema';

export async function logAudit(
  tenantId: string,
  userId: string | undefined,
  action: string,
  resourceId?: string,
  details?: any
) {
  await withTenant(tenantId, async (tx) => {
    await tx.insert(auditLogs).values({
      tenantId,
      userId,
      action,
      resourceId,
      details: details ? JSON.stringify(details) : null,
    });
  });
}

export async function logSecurityEvent(
  eventType: string,
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
  details?: string,
  tenantId?: string,
  ipAddress?: string
) {
  await db.insert(securityEvents).values({
    tenantId,
    eventType,
    severity,
    details,
    ipAddress,
  });
}
