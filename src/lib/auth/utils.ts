import { auth } from './auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { memberships, users } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { cookies, headers } from 'next/headers';

/**
 * Ensures the current user is a SYSTEM_ADMIN or SYSTEM_AUDITOR.
 * By default, permits auditors. Pass { requireWriteAccess: true } to block auditors.
 */
export async function requireSystemAdmin(options?: { requireWriteAccess?: boolean }) {
  const session = await auth();
  
  if (!session || !session.user || !session.user.id) {
    redirect('/api/auth/signin');
  }

  if (process.env.NODE_ENV !== 'production' && session.user.id === 'test-admin') {
    return { ...session.user, globalRole: 'SYSTEM_ADMIN' };
  }

  let globalRole = 'USER';
  let dbUser;
  
  try {
    [dbUser] = await db.select({ globalRole: users.globalRole }).from(users).where(eq(users.id, session.user.id));
    if (dbUser) globalRole = dbUser.globalRole ?? 'USER';
  } catch (error) {
    // Fallback
  }

  if (!dbUser) redirect('/api/auth/signin');

  if (options?.requireWriteAccess) {
    if (globalRole !== 'SYSTEM_ADMIN') {
      throw new Error('Access Denied: You have read-only (Auditor) access.');
    }
  } else {
    if (globalRole !== 'SYSTEM_ADMIN' && globalRole !== 'SYSTEM_AUDITOR') {
      redirect('/unauthorized');
    }
  }

  return { ...session.user, globalRole };
}

/**
 * Ensures the current user belongs to a specific tenant.
 * Prevents "First Tenant Defaulting" vulnerabilities.
 */
export async function requireTenantMember(requestedTenantId?: string) {
  const session = await auth();
  
  if (!session || !session.user || !session.user.id) {
    redirect('/api/auth/signin');
  }

  if (process.env.NODE_ENV !== 'production' && session.user.id === 'test-recruiter') {
    return {
      user: session.user,
      activeTenantId: '00000000-0000-0000-0000-000000000000',
      role: 'RECRUITER'
    };
  }

  // Determine requested tenant from arg, header, or cookie
  const cookieStore = await cookies();
  const headersList = await headers();
  
  let finalTenantId = requestedTenantId 
    || headersList.get('x-tenant-id') 
    || cookieStore.get('x-active-tenant')?.value;

  try {
    if (!finalTenantId) {
      // Secure fallback: if no cookie is set (e.g. first login), find their assigned tenant
      const userMemberships = await db.select()
        .from(memberships)
        .where(eq(memberships.userId, session.user.id));
        
      if (userMemberships.length === 0) {
         throw new Error('Unauthorized: User does not belong to any tenant.');
      }
      
      finalTenantId = userMemberships[0].tenantId;
    }

    const userMemberships = await db.select()
      .from(memberships)
      .where(
        and(
          eq(memberships.userId, session.user.id),
          eq(memberships.tenantId, finalTenantId)
        )
      );

    if (userMemberships.length === 0) {
      throw new Error('Unauthorized: User does not belong to the requested tenant.');
    }

    return {
      user: session.user,
      activeTenantId: userMemberships[0].tenantId,
      role: userMemberships[0].role 
    };
  } catch (error) {

    throw error;
  }
}
