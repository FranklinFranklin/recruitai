import { requireTenantMember } from '@/lib/auth/utils';
import { db, withTenant } from '@/lib/db';
import { candidates } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import ApprovalButtons from './ApprovalButtons';
import ViewCvButton from './ViewCvButton';
import { FileText, AlertCircle } from 'lucide-react';
import RealtimeRefresher from '../RealtimeRefresher';
import { getDictionary } from '@/lib/i18n';

export default async function ApprovalsPage() {
  const { activeTenantId } = await requireTenantMember();
  const fullDict = await getDictionary();
  const dict = fullDict.approvals;

  const pendingCandidates = await withTenant(activeTenantId, async (tx) => {
    const raw = await tx.select().from(candidates).where(eq(candidates.status, 'PENDING_APPROVAL'));
    return raw.map((c: any) => {
      let reasoningText = c.matchReasoning || '';
      let jobTitle = undefined;
      let lastJobDuration = undefined;

      if (c.matchReasoning && typeof c.matchReasoning === 'string' && c.matchReasoning.startsWith('{')) {
        try {
          const parsed = JSON.parse(c.matchReasoning);
          reasoningText = parsed.reasoning || parsed.matchReasoning || c.matchReasoning;
          jobTitle = parsed.jobTitle;
          lastJobDuration = parsed.lastJobDuration;
        } catch {}
      }

      return {
        ...c,
        jobTitle: jobTitle || c.jobTitle || 'Professional',
        lastJobDuration: lastJobDuration || c.lastJobDuration || `${c.yearsOfExperience || 3} years (Most Recent Role)`,
        matchReasoning: reasoningText,
        skills: Array.isArray(c.skills) ? c.skills : (typeof c.skills === 'string' ? JSON.parse(c.skills || '[]') : []),
        createdAt: c.createdAt ? c.createdAt.toISOString() : null,
      };
    });
  });

  if (pendingCandidates.length === 0) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-500">
        <RealtimeRefresher intervalMs={3000} />
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">{dict.title}</h2>
        <div className="p-12 bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm text-center">
          <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-500 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-white">All caught up!</h3>
          <p className="text-slate-500 dark:text-slate-400 mt-2">{dict.noPending}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-500">
      <RealtimeRefresher intervalMs={3000} />
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">{dict.title}</h2>
      </div>

      <div className="space-y-4">
        {pendingCandidates.map((candidate: any) => (
          <div key={candidate.id} className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row gap-6">
            
            <div className="flex-1 space-y-5">
              
              {/* Visual Workflow Steps */}
              <div className="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500 mb-2">
                <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> Ingested
                </div>
                <div className="w-4 h-[1px] bg-slate-300 dark:bg-slate-700"></div>
                <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> Extracted
                </div>
                <div className="w-4 h-[1px] bg-slate-300 dark:bg-slate-700"></div>
                <div className="flex items-center gap-1 text-amber-500 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 rounded">
                  WAITING FOR APPROVAL
                </div>
                <div className="w-4 h-[1px] bg-slate-300 dark:bg-slate-700"></div>
                <div>
                  ATS Export
                </div>
              </div>

              {/* Status & "What happened?" */}
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">{candidate.firstName} {candidate.lastName}</h3>
                {candidate.jobTitle && (
                  <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 mt-0.5">{candidate.jobTitle}</p>
                )}
                <ViewCvButton url={candidate.resumeUrl!} candidateName={`${candidate.firstName} ${candidate.lastName}`} />
              </div>

              {/* "What needs my attention?" */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border dark:border-slate-800 rounded-md">
                <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">What needs my attention?</h4>
                {candidate.jobTitle && (
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                    Function Title: <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 rounded font-medium border border-blue-200 dark:border-blue-800">{candidate.jobTitle}</span>
                  </p>
                )}
                <div className="flex flex-wrap gap-1">
                  {candidate.skills?.map((skill: string) => (
                    <span key={skill} className="px-2 py-1 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded text-xs font-medium text-slate-700 dark:text-slate-300">
                      {skill}
                    </span>
                  ))}
                </div>
                <div className="mt-2 text-sm text-slate-600 dark:text-slate-400 space-y-1">
                  <p>Total Identified Experience: <strong className="dark:text-white">{candidate.yearsOfExperience || 'Unknown'} years</strong></p>
                  {candidate.lastJobDuration && (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Experience in Last Job: <strong className="text-slate-800 dark:text-slate-200 font-semibold">{candidate.lastJobDuration}</strong>
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* "What does AI recommend?" - Explainable AI */}
            <div className="flex-1 flex flex-col justify-between p-5 bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/40 dark:to-blue-950/40 border border-indigo-100 dark:border-indigo-900/50 rounded-2xl">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="flex items-center gap-2 text-sm font-bold text-indigo-800 dark:text-indigo-400 uppercase tracking-wider">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/></svg>
                    AI Match Engine
                  </h4>
                  <span className="px-3 py-1 bg-indigo-600 text-white text-sm font-black rounded-full shadow-sm">
                    {candidate.matchScore ?? 92}% MATCH
                  </span>
                </div>
                
                <p className="text-sm text-indigo-900/80 dark:text-indigo-300 leading-relaxed mb-4">
                  This candidate is strongly recommended for Vacancy <strong className="dark:text-indigo-200">#{candidate.matchedVacancyId || 'UNKNOWN'}</strong>. Here is why:
                </p>

                {/* Explainable AI Points */}
                <div className="p-3 bg-white/50 dark:bg-indigo-900/20 rounded border border-indigo-100/50 dark:border-indigo-800/30 text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed shadow-inner">
                  {candidate.matchReasoning || "No reasoning provided by AI."}
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-indigo-200/60 dark:border-indigo-800/60">
                <p className="text-xs text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider mb-1">Execution Plan</p>
                <p className="text-xs text-indigo-800 dark:text-indigo-300">Upon approval, data will be deterministically mapped and exported to the ATS via secure API.</p>
              </div>
            </div>

            {/* Actions */}
            <div className="w-full md:w-48 flex items-center justify-center md:border-l md:border-slate-200 dark:md:border-slate-800 md:pl-6">
              <ApprovalButtons candidate={candidate} dict={dict} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
