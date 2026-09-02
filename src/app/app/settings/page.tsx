import { requireTenantMember } from '@/lib/auth/utils';
import { db } from '@/lib/db';
import { tenantSettings, integrationAccounts } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { ShieldAlert, ArrowLeft, Webhook, RefreshCw, Briefcase } from 'lucide-react';
import Link from 'next/link';
import ConnectAtsButton from './ConnectAtsButton';

export default async function AppSettingsPage() {
  const { user, activeTenantId, role } = await requireTenantMember();

  if (role !== 'TENANT_ADMIN') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 animate-in fade-in duration-500">
        <div className="w-24 h-24 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
          <ShieldAlert className="w-12 h-12 text-red-600 dark:text-red-500" />
        </div>
        <div className="space-y-2 max-w-md">
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Access Denied</h2>
          <p className="text-slate-500 dark:text-slate-400 text-lg">
            Tenant settings are restricted to Managers/Admins only.
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

  // Fetch tenant settings
  const settings = await db.select().from(tenantSettings).where(eq(tenantSettings.tenantId, activeTenantId)).limit(1);
  const integrations = await db.select().from(integrationAccounts).where(eq(integrationAccounts.tenantId, activeTenantId)).limit(1);
  
  const hasAts = integrations.length > 0;
  
  // In a real app, you would pass request origin to get absolute URL
  const webhookUrl = `/api/webhooks/vacancies`; 

  return (
    <div className="space-y-8 max-w-5xl mx-auto animate-in fade-in duration-500">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">Tenant Settings</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Manage integrations and automated data ingestion.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Webhook Settings */}
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-lg">
              <Webhook className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-lg text-slate-800 dark:text-white">Vacancy Webhook</h3>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            Post new job descriptions to this URL to automatically extract rules and create a Vacancy via AI.
          </p>
          
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">Endpoint URL</label>
              <input 
                readOnly 
                value={webhookUrl} 
                className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded text-sm text-slate-800 dark:text-slate-300 font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">x-tenant-id Header</label>
              <input 
                readOnly 
                value={activeTenantId} 
                className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded text-sm text-slate-800 dark:text-slate-300 font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">x-api-key Header</label>
              <input 
                readOnly 
                value="[Hidden for Security]" 
                className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded text-sm text-slate-400 dark:text-slate-500 font-mono italic"
              />
            </div>
          </div>
        </div>

        {/* ATS Sync Settings */}
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 rounded-lg">
              <Briefcase className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-lg text-slate-800 dark:text-white">Enterprise ATS Sync</h3>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            Automatically poll your integrated ATS (e.g., Bullhorn) to import new open jobs.
          </p>

          {hasAts ? (
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/30 rounded-full text-xs font-bold">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                ATS Connected: {integrations[0].provider.toUpperCase()}
              </div>
              <p className="text-xs text-slate-500">
                A background worker (Inngest) runs every hour to fetch jobs.
              </p>
              <button className="flex items-center justify-center gap-2 w-full py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg text-sm font-medium transition-colors">
                <RefreshCw className="w-4 h-4 text-slate-500" />
                Force Sync Now
              </button>
            </div>
          ) : (
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 text-center">
              <p className="text-sm text-slate-500 mb-3">No ATS integrated.</p>
              <ConnectAtsButton />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
