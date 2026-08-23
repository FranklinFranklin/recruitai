import { requireSystemAdmin } from '@/lib/auth/utils';
import { signOut } from '@/lib/auth/auth';
import Link from 'next/link';
import { ShieldAlert, Users, Building, Settings, LayoutDashboard, Database, Shield, LogOut, ArrowLeftRight } from 'lucide-react';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Enforce that only SYSTEM_ADMIN can access any route under /admin
  await requireSystemAdmin();

  return (
    <div className="flex h-screen bg-gray-50 text-slate-900">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-4 border-b border-slate-800">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-400" />
            Admin Portal
          </h1>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link href="/admin" className="flex items-center gap-2 p-2 hover:bg-slate-800 rounded">
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </Link>
          <Link href="/admin/tenants" className="flex items-center gap-2 p-2 hover:bg-slate-800 rounded">
            <Building className="w-4 h-4" />
            Tenants
          </Link>
          <Link href="/admin/users" className="flex items-center gap-2 p-2 hover:bg-slate-800 rounded text-gray-300 font-medium hover:text-white">
            <Users className="w-4 h-4" />
            Global Users
          </Link>
          <Link href="/admin/system" className="flex items-center gap-2 p-2 hover:bg-slate-800 rounded text-gray-300 font-medium hover:text-white">
            <ShieldAlert className="w-4 h-4" />
            System & Threats
          </Link>
          <Link href="/admin/settings" className="flex items-center gap-2 p-2 hover:bg-slate-800 rounded">
            <Settings className="w-4 h-4" />
            System Settings
          </Link>
        </nav>
        
        {/* Switch Account & Logout Buttons */}
        <div className="p-4 border-t border-slate-800 space-y-1">
          <form action={async () => {
            'use server';
            await signOut({ redirectTo: '/api/auth/signin?callbackUrl=/' });
          }}>
            <button type="submit" className="flex w-full items-center gap-2 p-2 hover:bg-slate-800 text-gray-300 hover:text-white rounded transition-colors text-sm font-medium">
              <ArrowLeftRight className="w-4 h-4" />
              Switch Account
            </button>
          </form>
          <form action={async () => {
            'use server';
            await signOut({ redirectTo: '/' });
          }}>
            <button type="submit" className="flex w-full items-center gap-2 p-2 hover:bg-red-900/50 text-gray-300 hover:text-white rounded transition-colors text-sm font-medium">
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
