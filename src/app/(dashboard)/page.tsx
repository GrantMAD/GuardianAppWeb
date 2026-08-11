'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useFamilyStore } from '@/store/familyStore';
import { getDailyUsage, getDailyScreenTimeSummary } from '@/lib/usage-service';
import { getPendingRequests, updateRequestStatus } from '@/lib/notification-service';
import type { UsageLog, PermissionRequest } from '@/types';

function formatMinutes(mins: number) {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

const CATEGORY_COLORS: Record<string, string> = {
  social:        '#7C6AF5',
  games:         '#F5A623',
  entertainment: '#E91E8C',
  education:     '#4CAF82',
  productivity:  '#2196F3',
  other:         '#9E9E9E',
};

export default function DashboardPage() {
  const { family, children, selectedChildId } = useFamilyStore();
  const selectedChild = children.find((c) => c.id === selectedChildId);

  const today = new Date().toISOString().slice(0, 10);

  const [totalMins, setTotalMins] = useState<number | null>(null);
  const [usageData, setUsageData] = useState<UsageLog[]>([]);
  const [weeklyData, setWeeklyData] = useState<{ day: string; minutes: number }[]>([]);
  const [requests, setRequests] = useState<PermissionRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!selectedChildId) return;
    let cancelled = false;

    setLoading(true);
    (async () => {
      try {
        const [usage, summary] = await Promise.all([
          getDailyUsage(selectedChildId, today),
          getDailyScreenTimeSummary(selectedChildId, today),
        ]);
        if (cancelled) return;
        setUsageData(usage);
        setTotalMins(summary?.total_minutes ?? 0);

        // Build last 7 days chart
        const days: { day: string; minutes: number }[] = [];
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const label = i === 0 ? 'Today' : d.toLocaleDateString('en', { weekday: 'short' });
          const sum = await getDailyScreenTimeSummary(selectedChildId, d.toISOString().slice(0, 10));
          days.push({ day: label, minutes: sum?.total_minutes ?? 0 });
        }
        if (!cancelled) setWeeklyData(days);
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [selectedChildId]);

  useEffect(() => {
    if (!family) return;
    getPendingRequests(family.id).then(setRequests).catch(console.error);
  }, [family]);

  const handleApprove = async (id: string) => {
    await updateRequestStatus(id, 'approved', null);
    setRequests((prev) => prev.filter((r) => r.id !== id));
  };

  const handleDeny = async (id: string) => {
    await updateRequestStatus(id, 'denied');
    setRequests((prev) => prev.filter((r) => r.id !== id));
  };

  const topApps = usageData.slice(0, 5);
  const maxWeekly = Math.max(...weeklyData.map((d) => d.minutes), 1);

  const usageSummary = [
    {
      label: 'Screen time today',
      value: loading ? '—' : formatMinutes(totalMins ?? 0),
      detail: selectedChild?.name ?? 'No child selected',
      icon: '⏱️',
      color: 'text-accent',
    },
    {
      label: 'Apps used today',
      value: loading ? '—' : String(usageData.length),
      detail: 'applications',
      icon: '📱',
      color: 'text-violet-400',
    },
    {
      label: 'Pending requests',
      value: String(requests.length),
      detail: requests.length === 1 ? 'needs review' : 'need review',
      icon: '🔔',
      color: 'text-amber-400',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-accent font-medium">Family overview</p>
        <h1 className="text-3xl font-bold text-text-primary mt-1">Parent Dashboard</h1>
        <p className="mt-1 text-text-muted text-sm">Monitor usage, manage restrictions, and stay on top of your family.</p>
      </div>

      {/* No child selected state */}
      {!selectedChildId && !loading && (
        <div className="rounded-2xl border border-dashed border-border bg-bg-card/60 p-10 text-center">
          <p className="text-3xl mb-3">👶</p>
          <p className="text-text-primary font-semibold mb-1">No child selected</p>
          <p className="text-text-muted text-sm mb-4">Add a child profile in Settings, then pair their device.</p>
          <Link
            href="/settings"
            className="inline-block rounded-xl bg-accent px-5 py-2 text-sm font-semibold text-bg-primary hover:bg-accent transition-colors"
          >
            Go to Settings
          </Link>
        </div>
      )}

      {selectedChildId && (
        <>
          {/* Stat cards */}
          <div className="grid gap-4 md:grid-cols-3">
            {usageSummary.map((item) => (
              <div key={item.label} className="rounded-2xl border border-border bg-bg-card p-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{item.icon}</span>
                  <p className="text-xs text-text-muted uppercase tracking-wider">{item.label}</p>
                </div>
                <p className={`text-3xl font-bold ${item.color}`}>{item.value}</p>
                <p className="mt-1 text-xs text-text-muted">{item.detail}</p>
              </div>
            ))}
          </div>

          {/* Pending requests banner */}
          {requests.length > 0 && (
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5 space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <span>🔔</span>
                <h2 className="text-sm font-semibold text-amber-400 uppercase tracking-wider">Pending Requests</h2>
              </div>
              {requests.map((req) => (
                <div key={req.id} className="flex items-center justify-between gap-4 rounded-xl bg-bg-card border border-border px-4 py-3">
                  <div className="min-w-0">
                    <p className="font-medium text-text-primary text-sm truncate">
                      {req.children?.name ?? 'Child'} — {req.installed_apps?.app_name ?? 'App'}
                    </p>
                    <p className="text-xs text-text-muted truncate">{req.message ?? 'Requested extra time'}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleApprove(req.id)}
                      className="rounded-lg bg-emerald-500/15 border border-emerald-500/30 px-3 py-1.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/25 transition-colors"
                    >
                      ✓ Approve
                    </button>
                    <button
                      onClick={() => handleDeny(req.id)}
                      className="rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-500/20 transition-colors"
                    >
                      ✗ Deny
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Charts row */}
          <div className="grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
            {/* Weekly bar chart */}
            <div className="rounded-2xl border border-border bg-bg-card p-6">
              <h2 className="text-base font-semibold text-text-primary">Weekly Screen Time</h2>
              <p className="text-xs text-text-muted mt-0.5 mb-5">Last 7 days for {selectedChild?.name}</p>
              {loading ? (
                <div className="h-32 flex items-center justify-center text-slate-600 text-sm">Loading chart…</div>
              ) : (
                <div className="flex items-end gap-2 h-32">
                  {weeklyData.map((entry) => (
                    <div key={entry.day} className="flex flex-1 flex-col items-center gap-2">
                      <div
                        className="w-full rounded-t-lg bg-gradient-to-t from-accent to-accent transition-all"
                        style={{ height: `${Math.max(4, (entry.minutes / maxWeekly) * 112)}px` }}
                        title={`${entry.day}: ${formatMinutes(entry.minutes)}`}
                      />
                      <span className="text-[10px] text-text-muted">{entry.day}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Top apps today */}
            <div className="rounded-2xl border border-border bg-bg-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-text-primary">Top Apps Today</h2>
                <Link href="/apps" className="text-xs text-accent hover:text-accent transition-colors">
                  See all →
                </Link>
              </div>
              {loading ? (
                <div className="text-center text-slate-600 text-sm py-6">Loading…</div>
              ) : topApps.length === 0 ? (
                <p className="text-center text-slate-600 text-sm py-6">No usage data yet</p>
              ) : (
                <ul className="space-y-2">
                  {topApps.map((log) => {
                    const name = log.installed_apps?.app_name ?? 'Unknown';
                    const cat = log.installed_apps?.category ?? 'other';
                    const color = CATEGORY_COLORS[cat] ?? '#9E9E9E';
                    return (
                      <li key={log.id} className="flex items-center justify-between gap-3 rounded-xl bg-bg-elevated/70 px-3 py-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div
                            className="w-6 h-6 rounded flex-shrink-0 flex items-center justify-center overflow-hidden"
                            style={{ backgroundColor: color + '22' }}
                          >
                            {log.installed_apps?.icon_url ? (
                              <img src={log.installed_apps.icon_url} alt={name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-[10px] font-bold" style={{ color }}>{name.charAt(0)}</span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-text-primary truncate">{name}</p>
                            <p className="text-[10px] text-text-muted capitalize">{cat}</p>
                          </div>
                        </div>
                        <span className="text-xs text-accent font-medium flex-shrink-0">
                          {formatMinutes(log.usage_minutes)}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          {/* Quick actions */}
          <div>
            <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { href: '/apps', icon: '📱', label: 'View Apps' },
                { href: '/rules', icon: '⏱️', label: 'Add Limit' },
                { href: '/rules', icon: '🔒', label: 'Block App' },
                { href: '/reports', icon: '📈', label: 'Reports' },
              ].map((action) => (
                <Link
                  key={action.label}
                  href={action.href}
                  className="rounded-2xl border border-border bg-bg-card p-4 flex flex-col items-center gap-2 hover:border-accent/40 hover:bg-bg-elevated/80 transition-all group"
                >
                  <span className="text-2xl group-hover:scale-110 transition-transform">{action.icon}</span>
                  <span className="text-xs font-medium text-text-primary group-hover:text-text-primary transition-colors">{action.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
