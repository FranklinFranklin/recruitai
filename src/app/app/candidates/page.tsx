import { requireTenantMember } from '@/lib/auth/utils';
import { db, withTenant } from '@/lib/db';
import { candidates } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { getDictionary } from "@/lib/i18n";
import { Users, FileText, CheckCircle, Clock, XCircle, UploadCloud } from 'lucide-react';
import Link from 'next/link';
import ViewCvButton from '../approvals/ViewCvButton';
import RealtimeRefresher from '../RealtimeRefresher';

export default async function CandidatesPage() {
  const fullDict = await getDictionary();
  const dict = fullDict.candidates;
  const { activeTenantId } = await requireTenantMember();

  // Securely query candidates only for this tenant using RLS
  const allCandidates = await withTenant(activeTenantId, async (tx) => {
    return await tx.select().from(candidates).orderBy(desc(candidates.createdAt));
  });

  if (allCandidates.length === 0) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <RealtimeRefresher intervalMs={3000} />
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">{dict.title}</h2>
        
        <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl p-16 flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 bg-blue-50 text-blue-400 rounded-full flex items-center justify-center mb-6">
            <Users className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">No Candidates Found</h3>
          <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-8">
            Your candidate database is currently empty. Our AI engine is ready to automatically process and match incoming CVs.
          </p>
          <Link 
            href="/app/upload" 
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-sm"
          >
            <UploadCloud className="w-5 h-5" />
            Upload First Candidate
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <RealtimeRefresher intervalMs={3000} />
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">{dict.title}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{dict.desc}</p>
        </div>
        <Link 
          href="/app/upload" 
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-lg transition-colors shadow-sm"
        >
          <UploadCloud className="w-4 h-4" />
          New Intake
        </Link>
      </div>
      
      <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-900 border-b dark:border-slate-800 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">
              <th className="p-4">Name</th>
              <th className="p-4">Matched Vacancy</th>
              <th className="p-4">AI Score</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {allCandidates.map((candidate: any) => (
              <tr key={candidate.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                <td className="p-4">
                  <div className="font-medium text-slate-800 dark:text-white">{candidate.firstName} {candidate.lastName}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{candidate.email || 'No email extracted'}</div>
                </td>
                <td className="p-4">
                  <span className="text-sm text-slate-600 font-medium">
                    {candidate.matchedVacancyId ? `#${candidate.matchedVacancyId}` : '-'}
                  </span>
                </td>
                <td className="p-4">
                  {candidate.matchScore ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
                      {candidate.matchScore}%
                    </span>
                  ) : (
                    <span className="text-slate-400 text-sm">-</span>
                  )}
                </td>
                <td className="p-4">
                  {candidate.status === 'APPROVED' && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-1 rounded border border-emerald-200">
                      <CheckCircle className="w-3 h-3" /> APPROVED
                    </span>
                  )}
                  {candidate.status === 'PENDING_APPROVAL' && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-100 px-2 py-1 rounded border border-amber-200">
                      <Clock className="w-3 h-3" /> PENDING
                    </span>
                  )}
                  {candidate.status === 'REJECTED' && (
                    <div className="flex flex-col gap-1">
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-red-700 bg-red-100 px-2 py-1 rounded border border-red-200">
                        <XCircle className="w-3 h-3" /> REJECTED
                      </span>
                      {candidate.matchReasoning && candidate.matchReasoning.startsWith('SYSTEM ERROR') && (
                        <span className="text-[10px] text-red-600 max-w-[150px] truncate" title={candidate.matchReasoning}>
                          {candidate.matchReasoning}
                        </span>
                      )}
                    </div>
                  )}
                  {candidate.status === 'PROCESSING' && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded border border-slate-200 animate-pulse">
                      <Clock className="w-3 h-3" /> PROCESSING
                    </span>
                  )}
                </td>
                <td className="p-4 text-right">
                  <ViewCvButton url={candidate.resumeUrl!} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
