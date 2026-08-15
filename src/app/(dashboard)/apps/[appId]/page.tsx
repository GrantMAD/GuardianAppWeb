'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useFamilyStore } from '@/store/familyStore';
import { getDailyUsage, getWeeklyUsage, getInstalledApps } from '@/lib/usage-service';
import { getRules, createRule, deleteRule } from '@/lib/rule-service';
import { logParentAction } from '@/lib/parent-service';
import type { InstalledApp, Rule } from '@/types';
import { formatMinutes } from '@/lib/utils';
import { useToast } from '@/hooks/useToast';


export default function AppDetailPage() {
  const { appId } = useParams<{ appId: string }>();
  const router = useRouter();
  const { selectedChildId, family } = useFamilyStore();
  const { toast } = useToast();

  const [appInfo, setAppInfo] = useState<InstalledApp | null>(null);
  const [rules, setRules] = useState<Rule[]>([]);
  const [todayMins, setTodayMins] = useState(0);
  const [weekData, setWeekData] = useState<{ label: string; minutes: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    if (!selectedChildId || !appId) return;
    setLoading(true);
    (async () => {
      try {
        const [allRules, todayUsage, installedApps, weekly] = await Promise.all([
          getRules(selectedChildId),
          getDailyUsage(selectedChildId, today),
          getInstalledApps(selectedChildId, false),
          getWeeklyUsage(selectedChildId, 7),
        ]);

        setRules(allRules.filter((r) => r.app_id === appId));
        const todayEntry = todayUsage.find((u: any) => u.app_id === appId);
        setTodayMins(todayEntry?.usage_minutes ?? 0);
        const info = (installedApps as InstalledApp[]).find((a) => a.id === appId);
        if (info) setAppInfo(info);

        setWeekData(weekly.map((d) => {
          const log = d.logs.find((u: any) => u.app_id === appId);
          return { label: d.label, minutes: log?.usage_minutes ?? 0 };
        }));
      } catch (err) {
        toast.error('Failed to load app details');
      } finally {
        setLoading(false);
      }
    })();
  }, [selectedChildId, appId]);

  const timeLimit = rules.find((r) => r.rule_type === 'TIME_LIMIT');
  const isBlocked = rules.some((r) => r.rule_type === 'BLOCK');
  const limitPct = timeLimit ? Math.min(100, Math.round((todayMins / (timeLimit.daily_limit_minutes ?? 1)) * 100)) : 0;

  const handleToggleBlock = async () => {
    if (!selectedChildId) return;
    setToggling(true);
    try {
      if (isBlocked) {
        const blockRule = rules.find((r) => r.rule_type === 'BLOCK');
        if (blockRule) {
          await deleteRule(blockRule.id);
          if (family) {
            await logParentAction(family.id, 'RULE_REMOVED', `Unblocked app: ${appInfo?.app_name || appId}`);
          }
          setRules((prev) => prev.filter((r) => r.id !== blockRule.id));
        }
      } else {
        const newRule = await createRule(selectedChildId, 'BLOCK', appId);
        if (family) {
          await logParentAction(family.id, 'RULE_CREATED', `Blocked app: ${appInfo?.app_name || appId}`);
        }
        setRules((prev) => [...prev, newRule]);
      }
    } catch (err) { toast.error('Failed to update block rule'); }
    finally { setToggling(false); }
  };

  const handleDeleteLimit = async () => {
    if (!timeLimit) return;
    await deleteRule(timeLimit.id);
    if (family) {
      await logParentAction(family.id, 'RULE_REMOVED', `Removed time limit for app: ${appInfo?.app_name || appId}`);
    }
    setRules((prev) => prev.filter((r) => r.id !== timeLimit.id));
  };


  const maxWeek = Math.max(...weekData.map((d) => d.minutes), 1);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-slate-600">
        <div className="w-8 h-8 border-2 border-border border-t-accent rounded-full animate-spin mb-3" />
        <p className="text-sm">Loading app data…</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* Back */}
      <Link href="/apps" className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors">
        ← Back to Apps
      </Link>

      {/* App header card */}
      <div className="rounded-2xl border border-border bg-bg-card p-5 flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-bg-elevated border border-border flex items-center justify-center text-2xl font-bold text-text-primary overflow-hidden flex-shrink-0">
          {appInfo?.icon_url
            ? <img src={appInfo.icon_url} alt={appInfo.app_name} className="w-12 h-12 rounded-xl object-contain" />
            : appInfo?.app_name?.charAt(0) ?? '?'
          }
        </div>
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-text-primary truncate">{appInfo?.app_name ?? 'Unknown App'}</h1>
          <p className="text-sm text-text-muted capitalize mt-0.5">{appInfo?.category ?? 'other'}</p>
          {appInfo?.package_name && (
            <p className="text-xs text-slate-600 mt-0.5 font-mono truncate">{appInfo.package_name}</p>
          )}
        </div>
      </div>

      {/* Time limit ring */}
      {timeLimit && (
        <div className="rounded-2xl border border-border bg-bg-card p-6 flex flex-col items-center gap-3">
          <p className="text-xs text-text-muted uppercase tracking-wider">Daily Usage</p>
          <div className="relative w-28 h-28">
            <svg className="w-28 h-28 -rotate-90" viewBox="0 0 112 112">
              <circle cx="56" cy="56" r="48" fill="none" stroke="#1e293b" strokeWidth="10" />
              <circle
                cx="56" cy="56" r="48" fill="none"
                stroke={limitPct >= 100 ? '#EF4444' : limitPct >= 80 ? '#F59E0B' : '#06B6D4'}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 48}`}
                strokeDashoffset={`${2 * Math.PI * 48 * (1 - limitPct / 100)}`}
                className="transition-all duration-700"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-bold text-text-primary">{limitPct}%</span>
              <span className="text-[10px] text-text-muted">used</span>
            </div>
          </div>
          <p className="text-sm text-text-muted">
            {formatMinutes(todayMins)} used of {formatMinutes(timeLimit.daily_limit_minutes ?? 0)} limit
          </p>
        </div>
      )}

      {/* Weekly chart */}
      <div className="rounded-2xl border border-border bg-bg-card p-6">
        <h2 className="text-sm font-semibold text-text-primary mb-4">📆 Last 7 Days</h2>
        <div className="flex items-end gap-2 h-24">
          {weekData.map((d) => (
            <div key={d.label} className="flex flex-1 flex-col items-center gap-1.5">
              <div
                className="w-full rounded-t-md bg-gradient-to-t from-violet-600 to-violet-400 transition-all"
                style={{ height: `${Math.max(3, (d.minutes / maxWeek) * 88)}px` }}
                title={`${d.label}: ${formatMinutes(d.minutes)}`}
              />
              <span className="text-[9px] text-text-muted">{d.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Rules */}
      <div className="rounded-2xl border border-border bg-bg-card p-6 space-y-4">
        <h2 className="text-sm font-semibold text-text-primary">🛡️ Rules</h2>

        {/* Block toggle */}
        <div className="flex items-center justify-between rounded-xl bg-bg-elevated/60 border border-border/60 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-text-primary">Block App</p>
            <p className="text-xs text-text-muted mt-0.5">Child cannot open this app</p>
          </div>
          <button
            onClick={handleToggleBlock}
            disabled={toggling}
            className={`relative w-12 h-6 rounded-full transition-colors duration-200 flex-shrink-0 ${
              isBlocked ? 'bg-red-500' : 'bg-slate-600'
            } disabled:opacity-50`}
          >
            <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${
              isBlocked ? 'translate-x-[26px]' : 'translate-x-0.5'
            }`} />
          </button>
        </div>

        {/* Time limit */}
        {timeLimit ? (
          <div className="flex items-center justify-between rounded-xl bg-bg-elevated/60 border border-border/60 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-text-primary">Daily Limit</p>
              <p className="text-sm font-bold text-amber-400 mt-0.5">{formatMinutes(timeLimit.daily_limit_minutes ?? 0)}</p>
            </div>
            <div className="flex gap-2">
              <Link
                href={`/rules/create-limit?appId=${appId}`}
                className="text-xs text-accent hover:text-accent transition-colors"
              >
                Edit
              </Link>
              <button
                onClick={handleDeleteLimit}
                className="text-xs text-red-400 hover:text-red-300 transition-colors"
              >
                Remove
              </button>
            </div>
          </div>
        ) : (
          <Link
            href={`/rules/create-limit?appId=${appId}`}
            className="flex w-full items-center justify-center rounded-xl border border-dashed border-border px-4 py-3 text-sm text-text-muted hover:text-text-primary hover:border-text-muted transition-colors"
          >
            + Add Time Limit
          </Link>
        )}
      </div>
    </div>
  );
}
