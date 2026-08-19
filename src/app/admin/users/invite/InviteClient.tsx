'use client';

import { useState } from 'react';
import { ShieldAlert, Users, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { generateAdminInviteToken } from './actions';

export default function AdminInviteClient({ tenants }: { tenants: {id: string, name: string}[] }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'RECRUITER' | 'TENANT_ADMIN'>('RECRUITER');
  const [tenantId, setTenantId] = useState(tenants.length > 0 ? tenants[0].id : '');
  const [loading, setLoading] = useState(false);
  const [inviteUrl, setInviteUrl] = useState('');
  const [error, setError] = useState('');

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setInviteUrl('');
    
    try {
      const result = await generateAdminInviteToken(email, role, tenantId);
      if (result.error) {
        setError(result.error);
      } else if (result.url) {
        setInviteUrl(result.url);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(inviteUrl);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 animate-in fade-in duration-300 max-w-2xl mx-auto mt-8">
      <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
        <Link href="/admin/users" className="p-2 hover:bg-slate-100 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-500" />
        </Link>
        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
          <Users className="w-5 h-5" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Global Admin: Invite User</h2>
      </div>

      <div className="p-4 mb-6 bg-amber-50 border border-amber-200 rounded-xl flex gap-3 text-sm text-amber-800">
        <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
        <p>
          <strong>Admin Notice:</strong> You are inviting a user on behalf of an agency (tenant). 
          The invite is single-use and expires after 24 hours.
        </p>
      </div>

      <form onSubmit={handleGenerate} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Target Tenant (Agency)</label>
          <select 
            value={tenantId}
            onChange={(e: any) => setTenantId(e.target.value)}
            className="w-full border border-slate-300 rounded-lg p-2.5 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
            required
          >
            {tenants.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">User's Email</label>
          <input 
            type="email" 
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-slate-300 rounded-lg p-2.5 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
            placeholder="new.user@agency.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
          <select 
            value={role}
            onChange={(e: any) => setRole(e.target.value)}
            className="w-full border border-slate-300 rounded-lg p-2.5 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            <option value="RECRUITER">Recruiter</option>
            <option value="TENANT_ADMIN">Manager (Tenant Admin)</option>
          </select>
        </div>

        {error && <p className="text-red-500 text-sm font-medium">{error}</p>}

        <button 
          type="submit" 
          disabled={loading || !!inviteUrl}
          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold rounded-lg transition-colors"
        >
          {loading ? 'Generating Secure Token...' : 'Generate Invite Link'}
        </button>
      </form>

      {inviteUrl && (
        <div className="mt-8 p-5 bg-slate-50 border border-slate-200 rounded-xl animate-in slide-in-from-bottom-2">
          <h3 className="text-sm font-bold text-slate-700 mb-2">Secure Invite Link Generated</h3>
          <p className="text-xs text-slate-500 mb-4">
            An email has been dispatched (if configured). Alternatively, you can copy the link below and send it directly.
          </p>
          <div className="flex items-center gap-2">
            <input 
              type="text" 
              readOnly 
              value={inviteUrl} 
              className="flex-1 bg-white border border-slate-300 rounded-lg p-2.5 text-sm text-slate-600 outline-none"
            />
            <button 
              onClick={copyToClipboard}
              className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-medium transition-colors text-sm"
            >
              Copy
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
