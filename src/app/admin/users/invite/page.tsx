import { getTenants } from './actions';
import AdminInviteClient from './InviteClient';

export default async function AdminInvitePage() {
  const tenants = await getTenants();

  return (
    <div className="w-full">
      <AdminInviteClient tenants={tenants} />
    </div>
  );
}
