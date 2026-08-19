'use server';

import { requireTenantMember } from '@/lib/auth/utils';
import { db } from '@/lib/db';
import { teamInvitations } from '@/lib/db/schema';
import crypto from 'crypto';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 're_mock_123');

export async function generateInviteToken(email: string, role: 'RECRUITER' | 'TENANT_ADMIN') {
  try {
    const { activeTenantId, role: currentRole } = await requireTenantMember();

    if (currentRole !== 'TENANT_ADMIN') {
      return { error: 'Unauthorized. Only managers can generate invites.' };
    }

    // Generate a secure random token
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Expires in 24 hours
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    await db.insert(teamInvitations).values({
      tenantId: activeTenantId,
      email,
      role,
      tokenHash,
      expiresAt,
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const inviteUrl = `${baseUrl}/api/invites/accept?token=${token}`;

    // Dispatch email via Resend
    if (process.env.RESEND_API_KEY) {
      await resend.emails.send({
        from: 'RecruitAI <invites@recruitai.demo>',
        to: email,
        subject: 'You have been invited to join RecruitAI',
        html: `
          <h2>Welcome to RecruitAI</h2>
          <p>You have been invited to join as a <strong>${role}</strong>.</p>
          <p>Click the link below to accept the invitation and login using your Google account. The link expires in 24 hours.</p>
          <a href="${inviteUrl}" style="display:inline-block;padding:10px 20px;background:#4F46E5;color:white;text-decoration:none;border-radius:5px;">Accept Invitation</a>
        `,
      });
      console.log(`[Resend] Successfully dispatched invite email to ${email}`);
    } else {
      console.warn(`[Resend Mock] Would send invite email to ${email} with url: ${inviteUrl}`);
    }

    return { url: inviteUrl };
  } catch (error: any) {
    console.error('Failed to generate invite:', error);
    return { error: 'Failed to generate invite link.' };
  }
}
