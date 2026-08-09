'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useFamilyStore } from '@/store/familyStore';
import { getDailyUsage, getWeeklyUsage, getInstalledApps } from '@/lib/usage-service';
import { getRules, createRule, deleteRule } from '@/lib/rule-service';
import type { InstalledApp, Rule } from '@/types';

function formatMinutes(mins: number) {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export default function AppDetailPage() {
  const { appId } = useParams<{ appId: string }>();
  const router = useRouter();
  const { selectedChildId } = useFamilyStore();

  const [appInfo, setAppInfo] = useState<InstalledApp | null>(null);
  const [rules, setRules] = useState<Rule[]>([]);
  const [todayMins, setTodayMins] = useState(0);
  const [weekData, setWeekData] = useState<{ label: string; minutes: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [showLimitForm, setShowLimitForm] = useState(false);
  const [limitMinutes, setLimitMinutes] = useState(60);
  const [saving, setSaving] = useState(false);

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
        console.error(err);
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
          setRules((prev) => prev.filter((r) => r.id !== blockRule.id));
        }
      } else {
        const newRule = await createRule(selectedChildId, 'BLOCK', appId);
        setRules((prev) => [...prev, newRule]);
      }
    } catch (err) { console.error(err); }
    finally { setToggling(false); }
  };

  const handleDeleteLimit = async () => {
    if (!timeLimit) return;
    await deleteRule(timeLimit.id);
    setRules((prev) => prev.filter((r) => r.id !== timeLimit.id));
  };

  const handleSaveLimit = async () => {
    if (!selectedChildId) return;
    setSaving(true);
    try {
      if (timeLimit) await deleteRule(timeLimit.id);
      const newRule = await createRule(selectedChildId, 'TIME_LIMIT', appId, undefined, limitMinutes);
      setRules((prev) => [...prev.filter((r) => r.rule_type !== 'TIME_LIMIT'), newRule]);
      setShowLimitForm(false);
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const maxWeek = Math.max(...weekData.map((d) => d.minutes), 1);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-slate-600">
        <div className="w-8 h-8 border-2 border-slate-700 border-t-cyan-500 rounded-full animate-spin mb-3" />
        <p className="text-sm">Loading app data…</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* Back */}
      <Link href="/apps" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors">
        ← Back to Apps
      </Link>

      {/* App header card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-2xl font-bold text-white overflow-hidden flex-shrink-0">
          {appInfo?.icon_url
            ? <img src={appInfo.icon_url} alt={appInfo.app_name} className="w-12 h-12 rounded-xl object-contain" />
            : appInfo?.app_name?.charAt(0) ?? '?'
          }
        </div>
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-white truncate">{appInfo?.app_name ?? 'Unknown App'}</h1>
          <p className="text-sm text-slate-400 capitalize mt-0.5">{appInfo?.category ?? 'other'}</p>
          {appInfo?.package_name && (
            <p className="text-xs text-slate-600 mt-0.5 font-mono truncate">{appInfo.package_name}</p>
          )}
        </div>
      </div>

      {/* Time limit ring */}
      {timeLimit && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 flex flex-col items-center gap-3">
          <p className="text-xs text-slate-500 uppercase tracking-wider">Daily Usage</p>
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
              <span className="text-xl font-bold text-white">{limitPct}%</span>
              <span className="text-[10px] text-slate-500">used</span>
            </div>
          </div>
          <p className="text-sm text-slate-400">
            {formatMinutes(todayMins)} used of {formatMinutes(timeLimit.daily_limit_minutes ?? 0)} limit
          </p>
        </div>
      )}

      {/* Weekly chart */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <h2 className="text-sm font-semibold text-slate-300 mb-4">📆 Last 7 Days</h2>
        <div className="flex items-end gap-2 h-24">
          {weekData.map((d) => (
            <div key={d.label} className="flex flex-1 flex-col items-center gap-1.5">
              <div
                className="w-full rounded-t-md bg-gradient-to-t from-violet-600 to-violet-400 transition-all"
                style={{ height: `${Math.max(3, (d.minutes / maxWeek) * 88)}px` }}
                title={`${d.label}: ${formatMinutes(d.minutes)}`}
              />
              <span className="text-[9px] text-slate-500">{d.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Rules */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-4">
        <h2 className="text-sm font-semibold text-slate-300">🛡️ Rules</h2>

        {/* Block toggle */}
        <div className="flex items-center justify-between rounded-xl bg-slate-800/60 border border-slate-700/60 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-white">Block App</p>
            <p className="text-xs text-slate-500 mt-0.5">Child cannot open this app</p>
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
          <div className="flex items-center justify-between rounded-xl bg-slate-800/60 border border-slate-700/60 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-white">Daily Limit</p>
              <p className="text-sm font-bold text-amber-400 mt-0.5">{formatMinutes(timeLimit.daily_limit_minutes ?? 0)}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { setLimitMinutes(timeLimit.daily_limit_minutes ?? 60); setShowLimitForm(true); }}
                className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                Edit
              </button>
              <button
                onClick={handleDeleteLimit}
                className="text-xs text-red-400 hover:text-red-300 transition-colors"
              >
                Remove
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowLimitForm(true)}
            className="w-full rounded-xl border border-dashed border-slate-700 px-4 py-3 text-sm text-slate-500 hover:text-slate-300 hover:border-slate-600 transition-colors"
          >
            + Add Time Limit
          </button>
        )}

        {/* Limit form */}
        {showLimitForm && (
          <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/5 p-4 space-y-4">
            <p className="text-sm font-medium text-cyan-300">Set Daily Limit</p>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={15}
                max={480}
                step={15}
                value={limitMinutes}
                onChange={(e) => setLimitMinutes(Number(e.target.value))}
                className="flex-1 accent-cyan-500"
              />
              <span className="text-sm font-bold text-white w-14 text-right">{formatMinutes(limitMinutes)}</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSaveLimit}
                disabled={saving}
                className="flex-1 rounded-xl bg-cyan-500 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-400 transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save Limit'}
              </button>
              <button
                onClick={() => setShowLimitForm(false)}
                className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
