import { requireTenantMember } from '@/lib/auth/utils';
import { db, withTenant } from '@/lib/db';
import { users, auditLogs } from '@/lib/db/schema';
import { eq, and, gte, sql } from 'drizzle-orm';
import ProfileForm from './ProfileForm';
import { getDictionary } from '@/lib/i18n';
import { cookies } from 'next/headers';

export default async function ProfilePage() {
  const { activeTenantId, user, role } = await requireTenantMember();
  
  const cookieStore = await cookies();
  const lang = cookieStore.get('lang')?.value || 'en';
  const dict = await getDictionary();

  // Fetch fresh user data from DB
  const [dbUser] = await db.select().from(users).where(eq(users.id, user.id as string));

  // Fetch approval stats via Audit Logs
  const { todayCount, monthCount, totalCount } = await withTenant(activeTenantId, async (tx) => {
    // Total Approvals
    const totalRes = await tx.select({ count: sql<number>`count(*)::int` })
      .from(auditLogs)
      .where(and(eq(auditLogs.userId, user.id as string), eq(auditLogs.action, 'CANDIDATE_APPROVED')));

    // Approvals this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const monthRes = await tx.select({ count: sql<number>`count(*)::int` })
      .from(auditLogs)
      .where(and(
        eq(auditLogs.userId, user.id as string), 
        eq(auditLogs.action, 'CANDIDATE_APPROVED'),
        gte(auditLogs.createdAt, startOfMonth)
      ));

    // Approvals today
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    
    const todayRes = await tx.select({ count: sql<number>`count(*)::int` })
      .from(auditLogs)
      .where(and(
        eq(auditLogs.userId, user.id as string), 
        eq(auditLogs.action, 'CANDIDATE_APPROVED'),
        gte(auditLogs.createdAt, startOfDay)
      ));
      
    return {
      totalCount: totalRes[0].count,
      monthCount: monthRes[0].count,
      todayCount: todayRes[0].count
    };
  });

  const stats = {
    today: todayCount,
    month: monthCount,
    total: totalCount,
    exported: totalCount, // Assuming auto-export on approval
  };

  return <ProfileForm user={dbUser} role={role} stats={stats} dict={dict.profile} initialLang={lang} />;
}
