import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { teamInvitations, memberships, securityEvents } from '@/lib/db/schema';
import { eq, and, isNull, gt } from 'drizzle-orm';
import crypto from 'crypto';
import { auth } from '@/lib/auth/auth';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Missing token' }, { status: 400 });
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Find valid token
    const invite = await db.query.teamInvitations.findFirst({
      where: and(
        eq(teamInvitations.tokenHash, tokenHash),
        isNull(teamInvitations.usedAt),
        gt(teamInvitations.expiresAt, new Date())
      )
    });

    if (!invite) {
      return NextResponse.json({ error: 'Invite link is invalid, expired, or has already been used.' }, { status: 400 });
    }

    // Check if user is logged in
    const session = await auth();

    if (!session || !session.user || !session.user.id) {
      // Redirect to login, returning here afterwards
      const callbackUrl = encodeURIComponent(`/api/invites/accept?token=${token}`);
      return NextResponse.redirect(new URL(`/api/auth/signin?callbackUrl=${callbackUrl}`, request.url));
    }

    const userId = session.user.id;

    // User is logged in. Check if already a member
    const existingMembership = await db.query.memberships.findFirst({
      where: and(
        eq(memberships.userId, userId),
        eq(memberships.tenantId, invite.tenantId)
      )
    });

    if (existingMembership) {
      // Just redirect to app, they are already a member
      return NextResponse.redirect(new URL('/app', request.url));
    }

    // Consume the token and create membership
    await db.transaction(async (tx) => {
      // Mark as used
      await tx.update(teamInvitations)
        .set({ usedAt: new Date() })
        .where(eq(teamInvitations.id, invite.id));

      // Create membership
      await tx.insert(memberships).values({
        userId: userId,
        tenantId: invite.tenantId,
        role: invite.role,
      });

      // Log security event for audit trail
      await tx.insert(securityEvents).values({
        tenantId: invite.tenantId,
        eventType: 'INVITE_ACCEPTED',
        severity: 'LOW',
        details: `User ${session?.user?.email || userId} accepted invite and joined as ${invite.role}`,
      });
    });

    // Success! Redirect to the app
    return NextResponse.redirect(new URL('/app', request.url));
    
  } catch (error) {
    console.error('Invite Accept Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
