'use client';

import { useEffect, useState } from 'react';
import { useFamilyStore } from '@/store/familyStore';
import { getRules, deleteRule } from '@/lib/rule-service';
import { getSchedules, createSchedule, deleteSchedule, toggleSchedule } from '@/lib/schedule-service';
import { getInstalledApps, getWeeklyUsageByApp } from '@/lib/usage-service';
import { logParentAction } from '@/lib/parent-service';
import type { Rule, Schedule, InstalledApp } from '@/types';
import Link from 'next/link';
import { formatMinutes } from '@/lib/utils';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { useToast } from '@/hooks/useToast';
import { ConfirmModal } from '@/components/ui/ConfirmModal';


const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function RulesPage() {
  const { selectedChildId, children, family } = useFamilyStore();
  const selectedChild = children.find((c) => c.id === selectedChildId);
  const { toast } = useToast();

  const [rules, setRules] = useState<Rule[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [weeklyUsage, setWeeklyUsage] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  // Create schedule form state
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [scheduleName, setScheduleName] = useState('');
  const [scheduleStart, setScheduleStart] = useState('22:00');
  const [scheduleEnd, setScheduleEnd] = useState('07:00');
  const [scheduleDays, setScheduleDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string, type: 'rule' | 'schedule' } | null>(null);

  const load = async () => {
    if (!selectedChildId) return;
    setLoading(true);
    try {
      const [r, s, weekly] = await Promise.all([
        getRules(selectedChildId),
        getSchedules(selectedChildId),
        getWeeklyUsageByApp(selectedChildId),
      ]);
      setRules(r);
      setSchedules(s);
      setWeeklyUsage(weekly);
    } catch (err) { toast.error('Failed to load rules'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [selectedChildId]);

  const timeLimits = rules.filter((r) => r.rule_type === 'TIME_LIMIT');
  const blockRules = rules.filter((r) => r.rule_type === 'BLOCK');

  const handleDeleteRule = async (ruleId: string) => {
    const rule = rules.find((r) => r.id === ruleId);
    await deleteRule(ruleId);
    if (family && rule) {
      const targetName = rule.app_id ? (rule.installed_apps?.app_name || 'an app') : (rule.category || 'a category');
      const ruleTypeName = rule.rule_type === 'BLOCK' ? 'block' : 'time limit';
      await logParentAction(family.id, 'RULE_REMOVED', `Removed ${ruleTypeName} rule for ${targetName}`);
    }
    setRules((prev) => prev.filter((r) => r.id !== ruleId));
  };

  const handleSaveSchedule = async () => {
    if (!selectedChildId || !scheduleName) return;
    setSavingSchedule(true);
    try {
      await createSchedule({
        child_id: selectedChildId,
        name: scheduleName,
        start_time: scheduleStart,
        end_time: scheduleEnd,
        days_of_week: scheduleDays,
        scope: 'all',
        block_type: 'block',
        is_active: true,
      });
      if (family) {
        await logParentAction(family.id, 'SCHEDULE_CREATED', `Created a new schedule: ${scheduleName}`);
      }
      setShowScheduleForm(false);
      setScheduleName('');
      setScheduleDays([0, 1, 2, 3, 4, 5, 6]);
      await load();
    } catch (err) { toast.error('Failed to save schedule'); }
    finally { setSavingSchedule(false); }
  };

  const handleDeleteSchedule = async (id: string) => {
    const schedule = schedules.find((s) => s.id === id);
    await deleteSchedule(id);
    if (family && schedule) {
      await logParentAction(family.id, 'SCHEDULE_REMOVED', `Deleted schedule: ${schedule.name}`);
    }
    setSchedules((prev) => prev.filter((s) => s.id !== id));
  };

  const handleToggleSchedule = async (id: string, current: boolean) => {
    const schedule = schedules.find((s) => s.id === id);
    await toggleSchedule(id, !current);
    if (family && schedule) {
      await logParentAction(family.id, 'SCHEDULE_UPDATED', `Turned ${!current ? 'on' : 'off'} schedule: ${schedule.name}`);
    }
    setSchedules((prev) => prev.map((s) => s.id === id ? { ...s, is_active: !current } : s));
  };

  const toggleDay = (day: number) => {
    setScheduleDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };



  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-accent font-medium">Rules & Restrictions</p>
        <h1 className="text-3xl font-bold text-text-primary mt-1">⚙️ Rules</h1>
        {selectedChild && (
          <p className="mt-1 text-text-muted text-sm">Manage time limits and blocked apps for {selectedChild.name}.</p>
        )}
      </div>

      {!selectedChildId ? (
        <div className="rounded-2xl border border-dashed border-border bg-bg-card/60 p-10 text-center">
          <p className="text-3xl mb-2">👶</p>
          <p className="text-text-primary font-semibold">No child selected</p>
          <p className="text-text-muted text-sm mt-1">Select a child from the sidebar to manage their rules.</p>
        </div>
      ) : loading ? (
        <div className="space-y-6 mt-6">
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Action buttons */}
          <div className="flex flex-wrap gap-3">
            <Link
              href="/rules/create-limit"
              className="flex items-center gap-2 rounded-xl bg-violet-500/15 border border-violet-500/30 px-4 py-2 text-sm font-semibold text-violet-300 hover:bg-violet-500/25 transition-all"
            >
              ⏱️ Add Time Limit
            </Link>
            <Link
              href="/rules/create-block"
              className="flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-2 text-sm font-semibold text-red-400 hover:bg-red-500/20 transition-all"
            >
              🔒 Block App
            </Link>
            <button
              onClick={() => setShowScheduleForm(true)}
              className="flex items-center gap-2 rounded-xl bg-bg-elevated border border-border px-4 py-2 text-sm font-semibold text-text-primary hover:border-text-muted transition-all"
            >
              🕐 Add Schedule
            </button>
          </div>

          {/* Schedule form */}
          {showScheduleForm && (
            <div className="rounded-2xl border border-accent/30 bg-accent/5 p-5 space-y-4">
              <p className="text-sm font-semibold text-accent">🕐 New Schedule</p>
              <input
                value={scheduleName} onChange={(e) => setScheduleName(e.target.value)}
                placeholder="Schedule name (e.g. Bedtime)"
                className="w-full rounded-xl border border-border bg-bg-elevated px-3 py-2 text-sm text-text-primary placeholder-slate-500 outline-none focus:border-accent/50"
              />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-text-muted block mb-1">Start time</label>
                  <input type="time" value={scheduleStart} onChange={(e) => setScheduleStart(e.target.value)}
                    className="w-full rounded-xl border border-border bg-bg-elevated px-3 py-2 text-sm text-text-primary outline-none focus:border-accent/50" />
                </div>
                <div>
                  <label className="text-xs text-text-muted block mb-1">End time</label>
                  <input type="time" value={scheduleEnd} onChange={(e) => setScheduleEnd(e.target.value)}
                    className="w-full rounded-xl border border-border bg-bg-elevated px-3 py-2 text-sm text-text-primary outline-none focus:border-accent/50" />
                </div>
              </div>
              <div>
                <label className="text-xs text-text-muted block mb-2">Days of week</label>
                <div className="flex gap-1.5">
                  {DAY_LABELS.map((d, i) => (
                    <button key={i} onClick={() => toggleDay(i)}
                      className={`flex-1 rounded-lg py-1.5 text-xs font-medium transition-all ${
                        scheduleDays.includes(i)
                          ? 'bg-accent/20 border border-accent/40 text-accent'
                          : 'bg-bg-elevated border border-border text-text-muted hover:text-text-primary'
                      }`}>
                      {d}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={handleSaveSchedule} disabled={savingSchedule || !scheduleName}
                  className="flex-1 rounded-xl bg-accent py-2 text-sm font-semibold text-bg-primary hover:bg-accent disabled:opacity-50 transition-colors">
                  {savingSchedule ? 'Saving…' : 'Save Schedule'}
                </button>
                <button onClick={() => setShowScheduleForm(false)}
                  className="rounded-xl border border-border px-4 py-2 text-sm text-text-muted hover:text-text-primary transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Time Limits list */}
          <div>
            <h2 className="text-xs uppercase tracking-wider text-text-muted mb-3 flex items-center gap-2">
              ⏳ Time Limits <span className="rounded-full bg-bg-elevated px-2 py-0.5 text-text-muted">{timeLimits.length}</span>
            </h2>
            {timeLimits.length === 0 ? (
              <p className="text-center text-slate-600 text-sm py-6 rounded-2xl border border-dashed border-border">No time limits set</p>
            ) : (
              <div className="space-y-2">
                {timeLimits.map((r) => (
                  <div key={r.id} className="flex items-center gap-3 rounded-2xl border border-border bg-bg-card px-4 py-3">
                    <div className="w-10 h-10 rounded-xl bg-bg-elevated border border-border flex items-center justify-center text-sm font-bold text-violet-400 flex-shrink-0">
                      {r.installed_apps?.icon_url
                        ? <img src={r.installed_apps.icon_url} alt={r.installed_apps.app_name} className="w-7 h-7 rounded-lg object-contain" loading="lazy" />
                        : r.installed_apps?.app_name?.charAt(0) ?? '⏱'
                      }
                    </div>
                  <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">{r.installed_apps?.app_name ?? r.category ?? 'All Apps'}</p>
                      <p className="text-xs text-amber-400 font-semibold">⏱ {formatMinutes(r.daily_limit_minutes ?? 0)} / day</p>
                      {r.weekly_limit_minutes != null && (
                        <p className="text-xs text-indigo-400 font-medium mt-0.5">
                          📅 {formatMinutes(r.weekly_limit_minutes)} / week
                          {r.app_id && weeklyUsage[r.app_id] !== undefined && (
                            <span className="ml-1.5 text-text-muted">
                              ({formatMinutes(weeklyUsage[r.app_id])} used)
                            </span>
                          )}
                        </p>
                      )}
                    </div>
                    <button onClick={() => setDeleteTarget({ id: r.id, type: 'rule' })}
                      className="text-xs text-red-400 hover:text-red-300 transition-colors flex-shrink-0">
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Blocked Apps list */}
          <div>
            <h2 className="text-xs uppercase tracking-wider text-text-muted mb-3 flex items-center gap-2">
              🛑 Blocked Apps <span className="rounded-full bg-bg-elevated px-2 py-0.5 text-text-muted">{blockRules.length}</span>
            </h2>
            {blockRules.length === 0 ? (
              <p className="text-center text-slate-600 text-sm py-6 rounded-2xl border border-dashed border-border">No apps blocked</p>
            ) : (
              <div className="space-y-2">
                {blockRules.map((r) => (
                  <div key={r.id} className="flex items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 px-4 py-3">
                    <div className="w-10 h-10 rounded-xl bg-bg-elevated border border-border flex items-center justify-center text-sm font-bold text-red-400 flex-shrink-0">
                      {r.installed_apps?.icon_url
                        ? <img src={r.installed_apps.icon_url} alt={r.installed_apps.app_name} className="w-7 h-7 rounded-lg object-contain" loading="lazy" />
                        : r.installed_apps?.app_name?.charAt(0) ?? '🔒'
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">{r.installed_apps?.app_name ?? r.category ?? 'All Apps'}</p>
                      <p className="text-xs text-red-400">Blocked</p>
                    </div>
                    <button onClick={() => setDeleteTarget({ id: r.id, type: 'rule' })}
                      className="text-xs text-red-400 hover:text-red-300 transition-colors flex-shrink-0">
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Schedules list */}
          <div>
            <h2 className="text-xs uppercase tracking-wider text-text-muted mb-3 flex items-center gap-2">
              🗓️ Schedules <span className="rounded-full bg-bg-elevated px-2 py-0.5 text-text-muted">{schedules.length}</span>
            </h2>
            {schedules.length === 0 ? (
              <p className="text-center text-slate-600 text-sm py-6 rounded-2xl border border-dashed border-border">No schedules set</p>
            ) : (
              <div className="space-y-2">
                {schedules.map((s) => (
                  <div key={s.id} className={`rounded-2xl border px-4 py-3 flex items-center gap-3 ${
                    s.is_active ? 'border-accent/20 bg-accent/5' : 'border-border bg-bg-card'
                  }`}>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary">{s.name}</p>
                      <p className="text-xs text-text-muted mt-0.5">
                        {s.start_time} – {s.end_time} •{' '}
                        {s.days_of_week.map((d) => DAY_LABELS[d]).join(', ')}
                      </p>
                    </div>
                    <button onClick={() => handleToggleSchedule(s.id, s.is_active)}
                      className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${s.is_active ? 'bg-accent' : 'bg-slate-600'}`}>
                      <span className={`absolute left-0 top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${s.is_active ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
                    </button>
                    <button onClick={() => setDeleteTarget({ id: s.id, type: 'schedule' })}
                      className="text-xs text-red-400 hover:text-red-300 transition-colors flex-shrink-0">
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      <ConfirmModal
        isOpen={!!deleteTarget}
        title={deleteTarget?.type === 'rule' ? 'Delete Rule' : 'Delete Schedule'}
        message={`Are you sure you want to delete this ${deleteTarget?.type === 'rule' ? 'rule' : 'schedule'}?`}
        onConfirm={() => {
          if (deleteTarget?.type === 'rule') handleDeleteRule(deleteTarget.id);
          else if (deleteTarget?.type === 'schedule') handleDeleteSchedule(deleteTarget.id);
        }}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
