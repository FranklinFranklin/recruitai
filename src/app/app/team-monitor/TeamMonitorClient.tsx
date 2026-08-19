'use client';

import { useState, useEffect } from 'react';
import { UserCircle, Shield, CheckCircle2, XCircle, Upload, ArrowUpRight, Users, UserCheck, UserPlus } from 'lucide-react';
import Link from 'next/link';

type Period = 'day' | 'week' | 'month' | 'year';
type Tab = 'stats' | 'online';

// Simulated "last seen" timestamps — in production these would come from
// a presence system (e.g. Upstash Redis with TTL or a Pusher channel).
function getOnlineStatus(recruiterId: string): { online: boolean; lastSeen: string } {
  // Deterministically simulate online/offline per user based on id hash
  const hash = recruiterId.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const online = hash % 3 !== 0; // ~67% online for demo
  const minsAgo = (hash % 45) + 1;
  return {
    online,
    lastSeen: online ? 'Active now' : `${minsAgo}m ago`,
  };
}

export default function TeamMonitorClient({ recruiters, dict }: { recruiters: any[]; dict: any }) {
  const [period, setPeriod] = useState<Period>('month');
  const [tab, setTab] = useState<Tab>('stats');
  const [now, setNow] = useState(new Date());

  // Refresh the clock every 30 seconds so "last seen" stays up-to-date
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const periodLabels: Record<Period, string> = {
    day: dict.today,
    week: dict.thisWeek,
    month: dict.thisMonth,
    year: dict.thisYear,
  };

  const totals = recruiters.reduce(
    (acc, r) => ({
      approvals: acc.approvals + r.approvals[period],
      rejections: acc.rejections + r.rejections[period],
      uploads: acc.uploads + r.uploads[period],
      forwarded: acc.forwarded + r.forwarded[period],
    }),
    { approvals: 0, rejections: 0, uploads: 0, forwarded: 0 }
  );

  const onlineCount = recruiters.filter((r) => getOnlineStatus(r.id).online).length;

  return (
    <>
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{dict.title}</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">{dict.desc}</p>
        </div>

        {/* Invite button — always visible */}
        <Link
          href="/app/team-monitor/invite"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-colors shadow-sm shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          Invite Colleague
        </Link>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800/60 p-1 rounded-xl w-fit" role="tablist" aria-label="Team Monitor Views">
        <button
          role="tab"
          aria-selected={tab === 'stats'}
          aria-controls="tabpanel-stats"
          id="tab-stats"
          onClick={() => setTab('stats')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
            tab === 'stats'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          Performance
        </button>
        <button
          role="tab"
          aria-selected={tab === 'online'}
          aria-controls="tabpanel-online"
          id="tab-online"
          onClick={() => setTab('online')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
            tab === 'online'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
          }`}
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          Online Now
          <span className="bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 text-[10px] font-black px-1.5 py-0.5 rounded-full">
            {onlineCount}
          </span>
        </button>
      </div>

      {/* ══════════════════════════════════════════
          TAB 1 — PERFORMANCE / STATS
      ══════════════════════════════════════════ */}
      {tab === 'stats' && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-2xl">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase">Team Approvals</span>
              </div>
              <span className="text-3xl font-black text-emerald-700 dark:text-emerald-300">{totals.approvals}</span>
            </div>

            <div className="p-5 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-2xl">
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                <span className="text-xs font-bold text-red-700 dark:text-red-400 uppercase">Team Rejections</span>
              </div>
              <span className="text-3xl font-black text-red-700 dark:text-red-300">{totals.rejections}</span>
            </div>

            <div className="p-5 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-2xl">
              <div className="flex items-center gap-2 mb-2">
                <Upload className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase">CVs Uploaded</span>
              </div>
              <span className="text-3xl font-black text-blue-700 dark:text-blue-300">{totals.uploads}</span>
            </div>

            <div className="p-5 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-2xl">
              <div className="flex items-center gap-2 mb-2">
                <ArrowUpRight className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span className="text-xs font-bold text-indigo-700 dark:text-indigo-400 uppercase">Forwarded to ATS</span>
              </div>
              <span className="text-3xl font-black text-indigo-700 dark:text-indigo-300">{totals.forwarded}</span>
            </div>
          </div>

          {/* Period selector + table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="font-bold text-slate-800 dark:text-white text-lg">
                Per Recruiter — {periodLabels[period]}
              </h3>
              <div className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                {(Object.keys(periodLabels) as Period[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                      period === p
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {periodLabels[p]}
                  </button>
                ))}
              </div>
            </div>

            {recruiters.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <UserCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="font-bold">No team members found.</p>
                <Link
                  href="/app/team-monitor/invite"
                  className="mt-4 inline-flex items-center gap-2 text-sm text-indigo-600 hover:underline font-medium"
                >
                  <UserPlus className="w-4 h-4" /> Invite your first colleague
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                      <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">{dict.recruiter}</th>
                      <th className="text-center px-4 py-3 text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase">{dict.approved}</th>
                      <th className="text-center px-4 py-3 text-xs font-bold text-red-600 dark:text-red-400 uppercase">{dict.rejected}</th>
                      <th className="text-center px-4 py-3 text-xs font-bold text-blue-600 dark:text-blue-400 uppercase">{dict.uploaded}</th>
                      <th className="text-center px-4 py-3 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase">{dict.forwarded}</th>
                      <th className="text-center px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Acceptance %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {recruiters
                      .sort((a, b) => b.approvals[period] - a.approvals[period])
                      .map((r) => {
                        const total = r.approvals[period] + r.rejections[period];
                        const acceptRate = total > 0 ? Math.round((r.approvals[period] / total) * 100) : 0;
                        const { online } = getOnlineStatus(r.id);

                        return (
                          <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <div className="relative shrink-0">
                                  <div
                                    className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden bg-cover bg-center border-2 border-white dark:border-slate-700 shadow-sm"
                                    style={{ backgroundImage: r.image ? `url(${r.image})` : 'none' }}
                                  >
                                    {!r.image && <UserCircle className="w-5 h-5 text-slate-400" />}
                                  </div>
                                  {/* Online dot */}
                                  <span
                                    className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 ${
                                      online ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'
                                    }`}
                                  />
                                </div>
                                <div>
                                  <p className="font-bold text-slate-800 dark:text-white text-sm">{r.name}</p>
                                  <p className="text-xs text-slate-400">{r.email}</p>
                                </div>
                                {r.role === 'TENANT_ADMIN' && (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-400 rounded">
                                    <Shield className="w-2.5 h-2.5" /> Manager
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-4 text-center">
                              <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">{r.approvals[period]}</span>
                            </td>
                            <td className="px-4 py-4 text-center">
                              <span className="text-lg font-black text-red-500 dark:text-red-400">{r.rejections[period]}</span>
                            </td>
                            <td className="px-4 py-4 text-center">
                              <span className="text-lg font-black text-blue-600 dark:text-blue-400">{r.uploads[period]}</span>
                            </td>
                            <td className="px-4 py-4 text-center">
                              <span className="text-lg font-black text-indigo-600 dark:text-indigo-400">{r.forwarded[period]}</span>
                            </td>
                            <td className="px-4 py-4 text-center">
                              {total > 0 ? (
                                <div className="flex items-center justify-center gap-2">
                                  <div className="w-16 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                      className={`h-2 rounded-full ${
                                        acceptRate >= 70 ? 'bg-emerald-500' : acceptRate >= 40 ? 'bg-amber-500' : 'bg-red-500'
                                      }`}
                                      style={{ width: `${acceptRate}%` }}
                                    />
                                  </div>
                                  <span
                                    className={`text-sm font-bold ${
                                      acceptRate >= 70
                                        ? 'text-emerald-600 dark:text-emerald-400'
                                        : acceptRate >= 40
                                        ? 'text-amber-600 dark:text-amber-400'
                                        : 'text-red-600 dark:text-red-400'
                                    }`}
                                  >
                                    {acceptRate}%
                                  </span>
                                </div>
                              ) : (
                                <span className="text-xs text-slate-400">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════
          TAB 2 — ONLINE NOW
      ══════════════════════════════════════════ */}
      {tab === 'online' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden animate-in fade-in duration-200">
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg">
                <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 dark:text-white">Team Presence</h3>
                <p className="text-xs text-slate-400">
                  {onlineCount} of {recruiters.length} colleagues online
                </p>
              </div>
            </div>
            <Link
              href="/app/team-monitor/invite"
              className="inline-flex items-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Invite
            </Link>
          </div>

          {recruiters.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <UserCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="font-bold">No team members yet.</p>
              <Link
                href="/app/team-monitor/invite"
                className="mt-4 inline-flex items-center gap-2 text-sm text-indigo-600 hover:underline font-medium"
              >
                <UserPlus className="w-4 h-4" /> Invite your first colleague
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {/* Online first */}
              {[...recruiters]
                .sort((a, b) => {
                  const aOnline = getOnlineStatus(a.id).online ? 0 : 1;
                  const bOnline = getOnlineStatus(b.id).online ? 0 : 1;
                  return aOnline - bOnline;
                })
                .map((r) => {
                  const { online, lastSeen } = getOnlineStatus(r.id);
                  return (
                    <div
                      key={r.id}
                      className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Avatar + presence dot */}
                      <div className="relative shrink-0">
                        <div
                          className="w-11 h-11 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden bg-cover bg-center border-2 border-white dark:border-slate-700 shadow-sm"
                          style={{ backgroundImage: r.image ? `url(${r.image})` : 'none' }}
                        >
                          {!r.image && <UserCircle className="w-6 h-6 text-slate-400" />}
                        </div>
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-900 ${
                            online ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'
                          }`}
                        />
                      </div>

                      {/* Name & email */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-slate-800 dark:text-white text-sm">{r.name}</p>
                          {r.role === 'TENANT_ADMIN' && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-400 rounded">
                              <Shield className="w-2.5 h-2.5" /> Manager
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 truncate">{r.email}</p>
                      </div>

                      {/* Status badge */}
                      <div className="shrink-0">
                        {online ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold rounded-full">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                            Active now
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-medium rounded-full">
                            <UserCheck className="w-3 h-3" />
                            {lastSeen}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}

          {/* Footer: invite CTA */}
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30">
            <Link
              href="/app/team-monitor/invite"
              className="flex items-center justify-center gap-2 w-full py-2 text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200 transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              Invite a new colleague
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
