import { requireTenantMember } from '@/lib/auth/utils';
import { handleSignOut, handleSwitchAccount } from '@/lib/auth/actions';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  Workflow, 
  Users, 
  Settings, 
  CheckSquare,
  BarChart,
  LogOut,
  UploadCloud,
  Shield,
  UserCircle,
  ArrowLeftRight
} from 'lucide-react';
import { getDictionary } from '@/lib/i18n';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Enforce that only valid tenant members can access /app
  const { role } = await requireTenantMember();
  const dict = await getDictionary();

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col shadow-sm z-10 transition-colors duration-300">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800">
          <h1 className="text-2xl font-black flex items-center gap-2 text-indigo-700 dark:text-indigo-400 tracking-tight">
            <Workflow className="w-6 h-6" />
            Recruit<span className="text-slate-800 dark:text-white">AI</span>
          </h1>
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {/* 1. Dashboard (Daily Overview) */}
          <Link href="/app" className="flex items-center gap-3 p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-300 font-medium transition-colors">
            <LayoutDashboard className="w-5 h-5 text-slate-500 dark:text-slate-400" />
            {dict.sidebar.dashboard}
          </Link>
          
          {/* 2. Approvals (Inbox / Action required) */}
          <Link href="/app/approvals" className="flex items-center gap-3 p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-300 font-medium transition-colors">
            <CheckSquare className="w-5 h-5 text-slate-500 dark:text-slate-400" />
            Approvals
          </Link>

          {/* 3. Upload CV (Adding new profiles) */}
          <Link href="/app/upload" className="flex items-center gap-3 p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-300 font-medium transition-colors">
            <UploadCloud className="w-5 h-5 text-slate-500 dark:text-slate-400" />
            Upload CV
          </Link>

          {/* 4. Candidates (Database/Archive) */}
          <Link href="/app/candidates" className="flex items-center gap-3 p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-300 font-medium transition-colors">
            <Users className="w-5 h-5 text-slate-500 dark:text-slate-400" />
            Candidates
          </Link>

          {/* 5. ROI Reports (Analytics) */}
          <Link href="/app/roi" className="flex items-center gap-3 p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-300 font-medium transition-colors">
            <BarChart className="w-5 h-5 text-slate-500 dark:text-slate-400" />
            ROI Reports
          </Link>

          {/* 6. Workflows (System processes) */}
          <Link href="/app/workflows" className="flex items-center gap-3 p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-300 font-medium transition-colors">
            <Workflow className="w-5 h-5 text-slate-500 dark:text-slate-400" />
            Workflows
          </Link>

          {role === 'TENANT_ADMIN' && (
            <>
              <div className="pt-4 pb-2">
                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2.5">{dict.sidebar.administration}</p>
              </div>
              <Link href="/app/settings" className="flex items-center gap-3 p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-300 font-medium transition-colors">
                <Settings className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                Settings
              </Link>
              <Link href="/app/team-monitor" className="flex items-center gap-3 p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-300 font-medium transition-colors">
                <Users className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                Team Monitor
              </Link>
            </>
          )}
        </nav>
        
        {/* User Profile & Logout */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 transition-colors duration-300">
          <Link href="/app/profile" className="flex items-center gap-3 px-2 mb-4 hover:bg-slate-200 dark:hover:bg-slate-800 p-2 -mx-2 rounded-xl transition-colors cursor-pointer group">
            <div className={`p-2 rounded-lg transition-colors ${role === 'TENANT_ADMIN' ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-200 dark:group-hover:bg-indigo-800' : 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-200 dark:group-hover:bg-emerald-800'}`}>
              {role === 'TENANT_ADMIN' ? <Shield className="w-5 h-5" /> : <UserCircle className="w-5 h-5" />}
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider group-hover:text-slate-500 dark:group-hover:text-slate-400 transition-colors">{dict.sidebar.myProfile}</span>
              <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                {role === 'TENANT_ADMIN' ? 'Manager' : 'Recruiter'}
              </span>
            </div>
          </Link>

          <div className="space-y-2">
            <form action={handleSwitchAccount}>
              <button type="submit" className="flex w-full justify-center items-center gap-2 p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg transition-all font-medium shadow-sm text-sm">
                <ArrowLeftRight className="w-4 h-4" />
                {dict.sidebar.switchAccount}
              </button>
            </form>

            <form action={handleSignOut}>
              <button type="submit" className="flex w-full justify-center items-center gap-2 p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-800 rounded-lg transition-all font-medium shadow-sm text-slate-600 dark:text-slate-300 text-sm">
                <LogOut className="w-4 h-4" />
                {dict.sidebar.logOff}
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
        {children}
      </main>
    </div>
  );
}
