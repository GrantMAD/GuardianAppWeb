'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useFamilyStore } from '@/store/familyStore';
import { getDailyUsage, getDailyScreenTimeSummary } from '@/lib/usage-service';
import { getPendingRequests, updateRequestStatus } from '@/lib/notification-service';
import { createSchedule } from '@/lib/schedule-service';
import { supabase } from '@/lib/supabase';
import type { UsageLog, PermissionRequest } from '@/types';
import { formatMinutes, CATEGORY_COLORS } from '@/lib/utils';
import { useToast } from '@/hooks/useToast';
import { Skeleton, SkeletonText } from '@/components/ui/Skeleton';

export default function DashboardPage() {
  const { family, children, selectedChildId } = useFamilyStore();
  const selectedChild = children.find((c) => c.id === selectedChildId);
  const { toast } = useToast();

  const today = new Date().toISOString().slice(0, 10);

  const [totalMins, setTotalMins] = useState<number | null>(null);
  const [usageData, setUsageData] = useState<UsageLog[]>([]);
  const [weeklyData, setWeeklyData] = useState<{ day: string; minutes: number }[]>([]);
  const [requests, setRequests] = useState<PermissionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [approveMins, setApproveMins] = useState<Record<string, number>>({});
  
  const [pauseModalOpen, setPauseModalOpen] = useState(false);
  const [pauseDuration, setPauseDuration] = useState(60);

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
        toast.error('Failed to load dashboard', 'Pull down to retry');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [selectedChildId]);

  useEffect(() => {
    if (!family || !children.length) return;
    
    // Fetch pending requests for all children
    getPendingRequests(family.id).then(setRequests).catch(() =>
      toast.error('Failed to load requests')
    );
  }, [family, children]);

  const handleApprove = async (id: string) => {
    const req = requests.find((r) => r.id === id);
    const mins = approveMins[id] || 15;

    await updateRequestStatus(id, 'approved', req?.request_type === 'unblock' ? null : mins);

    // For unblock requests: delete the matching BLOCK rule
    if (req?.request_type === 'unblock' && req.app_id && req.child_id && supabase) {
      const { error } = await supabase
        .from('rules')
        .delete()
        .eq('child_id', req.child_id)
        .eq('app_id', req.app_id)
        .eq('rule_type', 'BLOCK');

      if (error) toast.error('Failed to delete block rule');
    }

    setRequests((prev) => prev.filter((r) => r.id !== id));
  };

  const handleDeny = async (id: string) => {
    await updateRequestStatus(id, 'denied');
    setRequests((prev) => prev.filter((r) => r.id !== id));
  };

  const topApps = usageData.slice(0, 5);
  const maxWeekly = Math.max(...weeklyData.map((d) => d.minutes), 1);

  const handlePauseDevice = async () => {
    if (!selectedChildId) return;
    try {
      const now = new Date();
      const end = new Date(now.getTime() + pauseDuration * 60000);
      
      const startStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      const endStr = `${end.getHours().toString().padStart(2, '0')}:${end.getMinutes().toString().padStart(2, '0')}`;
      
      await createSchedule({
        child_id: selectedChildId,
        name: 'Emergency Pause',
        start_time: startStr,
        end_time: endStr,
        days_of_week: [now.getDay()],
        scope: 'all',
        block_type: 'block',
        is_active: true
      });
      setPauseModalOpen(false);
      toast.success(`Device paused for ${pauseDuration} minutes.`);
    } catch (e) {
      toast.error('Failed to pause device');
    }
  };

  const usageSummary = [
    {
      label: 'Screen time today',
      value: loading ? <Skeleton className="h-9 w-32" /> : formatMinutes(totalMins ?? 0),
      detail: selectedChild?.name ?? 'No child selected',
      icon: '⏱️',
      color: 'text-accent',
    },
    {
      label: 'Apps used today',
      value: loading ? <Skeleton className="h-9 w-12" /> : String(usageData.length),
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
      {!selectedChildId && !loading && children.length === 0 && (
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
                <div className={`text-3xl font-bold ${item.color}`}>{item.value}</div>
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
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                        style={req.request_type === 'unblock' ? {backgroundColor:'rgba(239,68,68,0.1)', color:'#f87171'} : {backgroundColor:'rgba(124,106,245,0.1)', color:'#9B8FF7'}}>
                        {req.request_type === 'unblock' ? '🔓 Unblock' : '⏱ Extra Time'}
                      </span>
                      <p className="font-medium text-text-primary text-sm truncate">
                        {req.children?.name ?? 'Child'} — {req.installed_apps?.app_name ?? 'App'}
                      </p>
                    </div>
                    <p className="text-xs text-text-muted truncate mt-1">{req.message ?? (req.request_type === 'unblock' ? 'Requesting unblock' : 'Requested extra time')}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {req.request_type === 'extra_time' && (
                      <select
                        value={approveMins[req.id] || 15}
                        onChange={(e) => setApproveMins({ ...approveMins, [req.id]: Number(e.target.value) })}
                        className="rounded-lg bg-bg-elevated border border-border px-2 py-1.5 text-xs text-text-primary outline-none"
                      >
                        <option value={15}>+15m</option>
                        <option value={30}>+30m</option>
                        <option value={60}>+1h</option>
                      </select>
                    )}
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
                <div className="flex items-end gap-2 h-32">
                  {[40, 70, 50, 90, 60, 100, 80].map((h, i) => (
                    <div key={i} className="flex flex-1 flex-col items-center gap-2">
                      <Skeleton className="w-full rounded-t-lg" style={{ height: `${h}px` }} />
                      <Skeleton className="h-3 w-8" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-end gap-2 h-32">
                  {weeklyData.map((entry) => (
                    <div key={entry.day} className="flex flex-1 flex-col items-center gap-2">
                      <div
                        className="w-full rounded-t-lg bg-gradient-to-t from-violet-500 to-cyan-400 transition-all"
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
                <ul className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <li key={i} className="flex items-center gap-3 rounded-xl bg-bg-primary/50 p-3">
                      <Skeleton className="h-10 w-10 rounded-lg" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-24 mb-2" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                      <Skeleton className="h-4 w-12" />
                    </li>
                  ))}
                </ul>
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
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
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
              <button
                onClick={() => setPauseModalOpen(true)}
                className="rounded-2xl border border-danger/40 bg-danger/10 p-4 flex flex-col items-center gap-2 hover:border-danger hover:bg-danger/20 transition-all group"
              >
                <span className="text-2xl group-hover:scale-110 transition-transform">🛑</span>
                <span className="text-xs font-medium text-danger group-hover:text-danger transition-colors">Pause Device</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* Pause Modal */}
      {pauseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl border border-border bg-bg-card p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-text-primary mb-2">🛑 Pause Device</h2>
            <p className="text-sm text-text-muted mb-6">
              Instantly block all apps for a set duration. This creates a temporary schedule.
            </p>
            <div className="space-y-4 mb-6">
              <label className="block">
                <span className="text-sm font-semibold text-text-primary mb-2 block">Duration</span>
                <select
                  value={pauseDuration}
                  onChange={(e) => setPauseDuration(Number(e.target.value))}
                  className="w-full rounded-xl border border-border bg-bg-elevated px-4 py-3 text-text-primary outline-none focus:border-accent"
                >
                  <option value={15}>15 Minutes</option>
                  <option value={30}>30 Minutes</option>
                  <option value={60}>1 Hour</option>
                  <option value={90}>1.5 Hours</option>
                  <option value={120}>2 Hours</option>
                </select>
              </label>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setPauseModalOpen(false)}
                className="flex-1 rounded-xl border border-border bg-bg-elevated py-3 font-semibold text-text-muted hover:text-text-primary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePauseDevice}
                className="flex-1 rounded-xl bg-danger py-3 font-semibold text-white hover:bg-red-600 transition-colors"
              >
                Pause Now
              </button>
            </div>
          </div>
        </div>
      )}


    </div>
  );
}
