'use client';

import { useEffect, useState } from 'react';
import { useFamilyStore } from '@/store/familyStore';
import { getWeeklyUsage } from '@/lib/usage-service';
import { formatMinutes, CATEGORY_COLORS } from '@/lib/utils';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { useToast } from '@/hooks/useToast';


type DayData = { date: string; label: string; total: number; logs: any[] };

export default function ReportsPage() {
  const { selectedChildId, children } = useFamilyStore();
  const selectedChild = children.find((c) => c.id === selectedChildId);
  const { toast } = useToast();

  const [weekData, setWeekData] = useState<DayData[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedDates, setExpandedDates] = useState<string[]>([]);
  const [daysRange, setDaysRange] = useState<7 | 30>(7);

  useEffect(() => {
    if (!selectedChildId) return;
    setLoading(true);
    getWeeklyUsage(selectedChildId, daysRange)
      .then(setWeekData)
      .catch(() => toast.error('Failed to load reports'))
      .finally(() => setLoading(false));
  }, [selectedChildId, daysRange]);

  const toggleDate = (date: string) => {
    setExpandedDates((prev) =>
      prev.includes(date) ? prev.filter((d) => d !== date) : [...prev, date]
    );
  };

  const totalWeekMins = weekData.reduce((sum, d) => sum + d.total, 0);
  const avgDailyMins = weekData.length ? Math.round(totalWeekMins / weekData.length) : 0;
  const peakDay = weekData.reduce((best, d) => d.total > best.total ? d : best, { date: '', label: '–', total: 0, logs: [] });
  const maxWeek = Math.max(...weekData.map((d) => d.total), 1);

  // Top apps across the week
  const appTotals: Record<string, { name: string; minutes: number; color: string; icon_url?: string }> = {};
  weekData.forEach((day) => {
    day.logs.forEach((u: any) => {
      const name = u.installed_apps?.app_name ?? 'Unknown';
      const cat = u.installed_apps?.category ?? 'other';
      if (!appTotals[name]) appTotals[name] = { name, minutes: 0, color: CATEGORY_COLORS[cat] ?? '#9E9E9E', icon_url: u.installed_apps?.icon_url };
      appTotals[name].minutes += u.usage_minutes;
    });
  });
  const topApps = Object.values(appTotals).sort((a, b) => b.minutes - a.minutes).slice(0, 5);
  const maxApp = Math.max(...topApps.map((a) => a.minutes), 1);

  const statCards = [
    { label: 'This week',  value: formatMinutes(totalWeekMins), icon: '📅', color: 'text-accent' },
    { label: 'Daily avg',  value: formatMinutes(avgDailyMins),  icon: '📊', color: 'text-violet-400' },
    { label: 'Peak day',   value: peakDay.label,                icon: '🏆', color: 'text-amber-400' },
    { label: 'Peak usage', value: formatMinutes(peakDay.total), icon: '⏰', color: 'text-rose-400' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-accent font-medium">Analytics</p>
          <h1 className="text-3xl font-bold text-text-primary mt-1">📈 Reports</h1>
          {selectedChild && (
            <p className="mt-1 text-text-muted text-sm">
              Screen time breakdown for {selectedChild.name} — last {daysRange} days.
            </p>
          )}
        </div>
        <div className="flex bg-bg-elevated p-1 rounded-xl border border-border">
          <button
            onClick={() => setDaysRange(7)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${daysRange === 7 ? 'bg-bg-card text-text-primary shadow-sm border border-border/50' : 'text-text-muted hover:text-text-primary'}`}
          >
            7 Days
          </button>
          <button
            onClick={() => setDaysRange(30)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${daysRange === 30 ? 'bg-bg-card text-text-primary shadow-sm border border-border/50' : 'text-text-muted hover:text-text-primary'}`}
          >
            30 Days
          </button>
        </div>
      </div>

      {!selectedChildId ? (
        <div className="rounded-2xl border border-dashed border-border bg-bg-card/60 p-10 text-center">
          <p className="text-3xl mb-2">📊</p>
          <p className="text-text-primary font-semibold">No child selected</p>
          <p className="text-text-muted text-sm mt-1">Select a child from the sidebar to view their reports.</p>
        </div>
      ) : loading ? (
        <div className="space-y-6 mt-6">
          <SkeletonCard className="h-64" />
        </div>
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {statCards.map((s) => (
              <div key={s.label} className="rounded-2xl border border-border bg-bg-card p-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{s.icon}</span>
                  <p className="text-xs text-text-muted uppercase tracking-wider">{s.label}</p>
                </div>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Weekly bar chart */}
          <div className="rounded-2xl border border-border bg-bg-card p-6">
            <h2 className="text-sm font-semibold text-text-primary mb-1">📊 Daily Screen Time</h2>
            <p className="text-xs text-text-muted mb-5">Total device usage per day over the past 7 days</p>
            {weekData.every((d) => d.total === 0) ? (
              <p className="text-center text-slate-600 text-sm py-8">No usage data for this period.</p>
            ) : (
              <div className="flex items-end gap-3 h-36">
                {weekData.map((d) => (
                  <div key={d.date} className="flex flex-1 flex-col items-center gap-2">
                    <span className="text-[10px] text-text-muted">{d.total > 0 ? formatMinutes(d.total) : ''}</span>
                    <div
                      className="w-full rounded-t-lg bg-gradient-to-t from-violet-500 to-cyan-400 transition-all cursor-pointer hover:brightness-110"
                      style={{ height: `${Math.max(4, (d.total / maxWeek) * 104)}px` }}
                      onClick={() => toggleDate(d.date)}
                      title={`${d.label}: ${formatMinutes(d.total)}`}
                    />
                    <span className="text-xs text-text-muted">{d.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top apps */}
          {topApps.length > 0 && (
            <div className="rounded-2xl border border-border bg-bg-card p-6">
              <h2 className="text-sm font-semibold text-text-primary mb-4">📱 Top Apps This Week</h2>
              <div className="space-y-3">
                {topApps.map((app) => (
                  <div key={app.name} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded flex-shrink-0 flex items-center justify-center overflow-hidden" style={{ backgroundColor: app.color + '22' }}>
                      {app.icon_url ? (
                        <img src={app.icon_url} alt={app.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[10px] font-bold" style={{ color: app.color }}>{app.name.charAt(0)}</span>
                      )}
                    </div>
                    <p className="text-sm text-text-primary w-24 truncate flex-shrink-0">{app.name}</p>
                    <div className="flex-1 rounded-full bg-bg-elevated h-2 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${(app.minutes / maxApp) * 100}%`,
                          backgroundColor: app.color,
                        }}
                      />
                    </div>
                    <span className="text-xs text-text-muted w-12 text-right flex-shrink-0">{formatMinutes(app.minutes)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Day-by-day breakdown */}
          <div>
            <h2 className="text-xs uppercase tracking-wider text-text-muted mb-3">📅 Day by Day</h2>
            <div className="space-y-2">
              {weekData.map((day) => {
                const isExpanded = expandedDates.includes(day.date);
                return (
                  <div key={day.date} className="rounded-2xl border border-border bg-bg-card overflow-hidden">
                    <button
                      onClick={() => toggleDate(day.date)}
                      className="w-full flex items-center justify-between px-5 py-4 hover:bg-bg-elevated/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-text-primary">{day.label}</span>
                        <span className="text-xs text-text-muted">{day.date}</span>
                        <span className="text-slate-600 text-xs">{isExpanded ? '▲' : '▼'}</span>
                      </div>
                      <span className="text-sm font-bold text-accent">{formatMinutes(day.total)}</span>
                    </button>

                    {isExpanded && (
                      <div className="px-5 pb-4 border-t border-border/60">
                        {day.logs.length === 0 ? (
                          <p className="text-slate-600 text-xs py-3">No usage on this day.</p>
                        ) : (
                          <div className="space-y-2 pt-3">
                            {day.logs.slice(0, 5).map((u: any) => {
                              const name = u.installed_apps?.app_name ?? 'Unknown';
                              const cat = u.installed_apps?.category ?? 'other';
                              const color = CATEGORY_COLORS[cat] ?? '#9E9E9E';
                              return (
                                <div key={u.id} className="flex items-center gap-2">
                                  <div className="w-5 h-5 rounded flex-shrink-0 flex items-center justify-center overflow-hidden" style={{ backgroundColor: color + '22' }}>
                                    {u.installed_apps?.icon_url ? (
                                      <img src={u.installed_apps.icon_url} alt={name} className="w-full h-full object-cover" />
                                    ) : (
                                      <span className="text-[9px] font-bold" style={{ color }}>{name.charAt(0)}</span>
                                    )}
                                  </div>
                                  <span className="text-xs text-text-muted flex-1 truncate">{name}</span>
                                  <span className="text-xs text-text-muted">{formatMinutes(u.usage_minutes)}</span>
                                </div>
                              );
                            })}
                            {day.logs.length > 5 && (
                              <p className="text-xs text-slate-600 pl-3.5">+{day.logs.length - 5} more apps</p>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
