import { requireTenantMember } from '@/lib/auth/utils';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { ShieldAlert, ArrowLeft, Settings } from 'lucide-react';
import Link from 'next/link';
import { getDictionary } from '@/lib/i18n';

export default async function AppSettingsPage() {
  const { user } = await requireTenantMember();
  
  // Check if the user is a System Admin
  const [dbUser] = await db.select().from(users).where(eq(users.id, user.id as string));
  const isSystemAdmin = dbUser?.globalRole === 'SYSTEM_ADMIN';

  if (!isSystemAdmin) {
    // Manager or Recruiter -> Show "Not Allowed"
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 animate-in fade-in duration-500">
        <div className="w-24 h-24 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
          <ShieldAlert className="w-12 h-12 text-red-600 dark:text-red-500" />
        </div>
        <div className="space-y-2 max-w-md">
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Access Denied</h2>
          <p className="text-slate-500 dark:text-slate-400 text-lg">
            You're not allowed to view this page. System settings are restricted to Administrators only.
          </p>
        </div>
        <Link 
          href="/app"
          className="mt-8 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 shadow-sm"
        >
          <ArrowLeft className="w-5 h-5" />
          Return to Dashboard
        </Link>
      </div>
    );
  }

  // System Admin -> Redirect to the actual Admin Settings page where the real settings live
  redirect('/admin/settings');
}
