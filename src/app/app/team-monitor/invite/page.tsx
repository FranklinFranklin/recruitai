import { requireTenantMember } from '@/lib/auth/utils';
import { redirect } from 'next/navigation';
import InviteClient from './InviteClient';

export default async function InvitePage() {
  const { role } = await requireTenantMember();

  // Strict RBAC: Only TENANT_ADMIN can generate invites
  if (role !== 'TENANT_ADMIN') {
    redirect('/app/team-monitor');
  }

  return (
    <div className="max-w-2xl mx-auto py-8">
      <InviteClient />
    </div>
  );
}
