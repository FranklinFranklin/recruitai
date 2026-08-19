import { requireTenantMember } from '@/lib/auth/utils';
import { db, withTenant } from '@/lib/db';
import { users, memberships, auditLogs } from '@/lib/db/schema';
import { eq, and, gte, sql, inArray } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import TeamMonitorClient from './TeamMonitorClient';
import RealtimeRefresher from '../RealtimeRefresher';
import { getDictionary } from '@/lib/i18n';

export default async function TeamMonitorPage() {
  const { activeTenantId, role } = await requireTenantMember();
  const fullDict = await getDictionary();
  const dict = fullDict.teamMonitor;

  // Only admins / managers can access this page
  if (role !== 'TENANT_ADMIN') {
    redirect('/app');
  }

  // 1. Get all team members for this tenant
  const teamMemberships = await db.select({
    userId: memberships.userId,
    role: memberships.role,
    memberSince: memberships.createdAt,
  }).from(memberships).where(eq(memberships.tenantId, activeTenantId));

  const userIds = teamMemberships.map(m => m.userId);

  // 2. Fetch user details
  let teamUsers: any[] = [];
  if (userIds.length > 0) {
    teamUsers = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      image: users.image,
    }).from(users).where(inArray(users.id, userIds));
  }

  // 3. Build date boundaries
  const now = new Date();

  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);

  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay() + 1); // Monday
  startOfWeek.setHours(0, 0, 0, 0);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  // 4. Fetch all audit logs for this tenant's users (approvals, uploads, forwards)
  const actionTypes = ['CANDIDATE_APPROVED', 'CANDIDATE_REJECTED', 'CANDIDATE_UPLOADED', 'CANDIDATE_FORWARDED'];

  const allLogs = await withTenant(activeTenantId, async (tx) => {
    return await tx.select({
      userId: auditLogs.userId,
      action: auditLogs.action,
      createdAt: auditLogs.createdAt,
    }).from(auditLogs).where(
      and(
        inArray(auditLogs.action, actionTypes),
        gte(auditLogs.createdAt, startOfYear) // Only need this year's data
      )
    );
  });

  // 5. Build per-recruiter stats
  const recruiterStats = teamUsers.map(u => {
    const membership = teamMemberships.find(m => m.userId === u.id);
    const userLogs = allLogs.filter((l: any) => l.userId === u.id);

    const countByActionAndPeriod = (action: string, since: Date) =>
      userLogs.filter((l: any) => l.action === action && l.createdAt >= since).length;

    return {
      id: u.id,
      name: u.name || u.email,
      email: u.email,
      image: u.image,
      role: membership?.role || 'RECRUITER',
      memberSince: membership?.memberSince?.toISOString() || '',
      approvals: {
        day: countByActionAndPeriod('CANDIDATE_APPROVED', startOfDay),
        week: countByActionAndPeriod('CANDIDATE_APPROVED', startOfWeek),
        month: countByActionAndPeriod('CANDIDATE_APPROVED', startOfMonth),
        year: countByActionAndPeriod('CANDIDATE_APPROVED', startOfYear),
      },
      rejections: {
        day: countByActionAndPeriod('CANDIDATE_REJECTED', startOfDay),
        week: countByActionAndPeriod('CANDIDATE_REJECTED', startOfWeek),
        month: countByActionAndPeriod('CANDIDATE_REJECTED', startOfMonth),
        year: countByActionAndPeriod('CANDIDATE_REJECTED', startOfYear),
      },
      uploads: {
        day: countByActionAndPeriod('CANDIDATE_UPLOADED', startOfDay),
        week: countByActionAndPeriod('CANDIDATE_UPLOADED', startOfWeek),
        month: countByActionAndPeriod('CANDIDATE_UPLOADED', startOfMonth),
        year: countByActionAndPeriod('CANDIDATE_UPLOADED', startOfYear),
      },
      forwarded: {
        day: countByActionAndPeriod('CANDIDATE_FORWARDED', startOfDay),
        week: countByActionAndPeriod('CANDIDATE_FORWARDED', startOfWeek),
        month: countByActionAndPeriod('CANDIDATE_FORWARDED', startOfMonth),
        year: countByActionAndPeriod('CANDIDATE_FORWARDED', startOfYear),
      },
    };
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500 pb-12">
      <RealtimeRefresher />
      <TeamMonitorClient recruiters={recruiterStats} dict={dict} />
    </div>
  );
}
