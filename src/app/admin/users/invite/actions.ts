'use server';

import { requireSystemAdmin } from '@/lib/auth/utils';
import { db } from '@/lib/db';
import { teamInvitations, tenants } from '@/lib/db/schema';
import crypto from 'crypto';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 're_mock_123');

export async function getTenants() {
  await requireSystemAdmin();
  return await db.select({ id: tenants.id, name: tenants.name }).from(tenants);
}

export async function generateAdminInviteToken(email: string, role: 'RECRUITER' | 'TENANT_ADMIN', tenantId: string) {
  try {
    await requireSystemAdmin({ requireWriteAccess: true });

    if (!tenantId) {
      return { error: 'Tenant is required.' };
    }

    // Generate a secure random token
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Expires in 24 hours
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    await db.insert(teamInvitations).values({
      tenantId,
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
        from: 'RecruitAI Admin <invites@recruitai.demo>',
        to: email,
        subject: 'You have been invited to join RecruitAI',
        html: `
          <h2>Welcome to RecruitAI</h2>
          <p>You have been invited by an Administrator to join as a <strong>${role}</strong>.</p>
          <p>Click the link below to accept the invitation and login using your Microsoft account. The link expires in 24 hours.</p>
          <a href="${inviteUrl}" style="display:inline-block;padding:10px 20px;background:#4F46E5;color:white;text-decoration:none;border-radius:5px;">Accept Invitation</a>
        `,
      });
      console.log(`[Resend] Successfully dispatched admin invite email to ${email}`);
    } else {
      console.warn(`[Resend Mock] Would send admin invite email to ${email} with url: ${inviteUrl}`);
    }

    return { url: inviteUrl };
  } catch (error: any) {
    console.error('Failed to generate admin invite:', error);
    return { error: 'Failed to generate invite link.' };
  }
}
