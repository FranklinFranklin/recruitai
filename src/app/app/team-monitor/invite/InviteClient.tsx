'use client';

import { useState } from 'react';
import { ShieldAlert, Users, Copy, Check, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { generateInviteToken } from './actions';

export default function InviteClient() {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'RECRUITER' | 'TENANT_ADMIN'>('RECRUITER');
  const [loading, setLoading] = useState(false);
  const [inviteUrl, setInviteUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setInviteUrl('');
    
    try {
      const result = await generateInviteToken(email, role);
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
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-6 animate-in fade-in duration-300">
      <div className="flex items-center gap-3 mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
        <Link href="/app/team-monitor" className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-500" />
        </Link>
        <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
          <Users className="w-5 h-5" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Invite Colleague</h2>
      </div>

      <div className="p-4 mb-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl flex gap-3 text-sm text-amber-800 dark:text-amber-400">
        <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
        <p>
          <strong>Security Notice:</strong> Invite links are single-use and automatically expire after 24 hours. 
          Generating an invite with the <strong>TENANT_ADMIN</strong> role gives the user full control over your agency's settings.
        </p>
      </div>

      <form onSubmit={handleGenerate} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Colleague's Email</label>
          <input 
            type="email" 
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
            placeholder="colleague@agency.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Role</label>
          <select 
            value={role}
            onChange={(e: any) => setRole(e.target.value)}
            className="w-full border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            <option value="RECRUITER">Recruiter (Upload CVs, Approve Matches)</option>
            <option value="TENANT_ADMIN">Manager (Full Access, Billing, Settings)</option>
          </select>
        </div>

        {error && <p className="text-red-500 text-sm font-medium">{error}</p>}

        <button 
          type="submit" 
          disabled={loading || !!inviteUrl}
          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white font-bold rounded-lg transition-colors"
        >
          {loading ? 'Generating Secure Token...' : 'Generate Invite Link'}
        </button>
      </form>

      {inviteUrl && (
        <div className="mt-8 p-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl animate-in slide-in-from-bottom-2">
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Secure Invite Link Generated</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Send this link to your colleague. It will expire in 24 hours.</p>
          
          <div className="flex gap-2">
            <input 
              type="text" 
              readOnly 
              value={inviteUrl} 
              className="flex-1 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 bg-white dark:bg-slate-900 text-sm text-slate-600 dark:text-slate-300 outline-none"
            />
            <button 
              onClick={copyToClipboard}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-lg flex items-center gap-2 transition-colors"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
