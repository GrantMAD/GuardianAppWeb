'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useFamilyStore } from '@/store/familyStore';
import { getInstalledApps } from '@/lib/usage-service';
import { createTimeLimitRule, logParentAction } from '@/lib/parent-service';
import type { InstalledApp } from '@/types';
import Link from 'next/link';
import { formatMinutes } from '@/lib/utils';
import { useToast } from '@/hooks/useToast';

const CATEGORIES = [
  { value: 'social', label: 'Social Media' },
  { value: 'games', label: 'Games' },
  { value: 'education', label: 'Education' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'productivity', label: 'Productivity' },
  { value: 'communication', label: 'Communication' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'other', label: 'Other' },
];


export default function CreateLimitPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { children, selectedChildId, setSelectedChildId, family } = useFamilyStore();
  const { toast } = useToast();
  
  const [apps, setApps] = useState<InstalledApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [targetType, setTargetType] = useState<'app' | 'category'>('app');
  const [appId, setAppId] = useState(searchParams.get('appId') || '');
  const [categoryId, setCategoryId] = useState('');
  const [limitMinutes, setLimitMinutes] = useState(60);
  const [weeklyEnabled, setWeeklyEnabled] = useState(false);
  const [weeklyLimitHours, setWeeklyLimitHours] = useState(5);

  useEffect(() => {
    if (!selectedChildId) return;
    setLoading(true);
    getInstalledApps(selectedChildId)
      .then((a) => setApps((a ?? []) as InstalledApp[]))
      .finally(() => setLoading(false));
  }, [selectedChildId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChildId || (targetType === 'app' && !appId) || (targetType === 'category' && !categoryId)) return;
    const weeklyLimitMinutes = weeklyEnabled ? weeklyLimitHours * 60 : null;
    if (weeklyEnabled && weeklyLimitMinutes !== null && weeklyLimitMinutes < limitMinutes) {
      toast.error('Weekly limit must be at least as large as the daily limit');
      return;
    }
    setSaving(true);
    try {
      await createTimeLimitRule({
        child_id: selectedChildId,
        app_id: targetType === 'app' ? appId : undefined,
        category: targetType === 'category' ? categoryId : undefined,
        daily_limit_minutes: limitMinutes,
        weekly_limit_minutes: weeklyLimitMinutes,
      });
      if (family) {
        const targetName = targetType === 'app' ? apps.find(a => a.id === appId)?.app_name || 'an app' : categoryId || 'a category';
        const weeklyDetail = weeklyEnabled ? `, ${weeklyLimitHours}h/week` : '';
        await logParentAction(
          family.id,
          'RULE_CREATED',
          `Created a time limit rule of ${limitMinutes} minutes/day${weeklyDetail} for ${targetName}`
        );
      }
      router.push('/rules');
    } catch (err) {
      toast.error('Failed to save time limit');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <Link href="/rules" className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors">
        ← Back to Rules
      </Link>

      <div>
        <h1 className="text-3xl font-bold text-text-primary">⏱️ Create Time Limit</h1>
        <p className="mt-1 text-text-muted text-sm">Set a daily usage limit for a specific app or category.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6 rounded-3xl border border-border bg-bg-card p-6 md:p-8">
        
        {/* Child Selection */}
        <div>
          <label className="block text-sm font-semibold text-text-primary mb-2">Apply to</label>
          <select
            value={selectedChildId || ''}
            onChange={(e) => setSelectedChildId(e.target.value)}
            className="w-full rounded-xl border border-border bg-bg-elevated px-4 py-3 text-text-primary outline-none focus:border-accent"
            required
          >
            <option value="" disabled>Select a child…</option>
            {children.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Target Type Selection */}
        <div className="flex bg-bg-elevated p-1 rounded-xl border border-border w-full max-w-sm">
          <button
            type="button"
            onClick={() => setTargetType('app')}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${targetType === 'app' ? 'bg-bg-card text-text-primary shadow-sm border border-border/50' : 'text-text-muted hover:text-text-primary'}`}
          >
            Specific App
          </button>
          <button
            type="button"
            onClick={() => setTargetType('category')}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${targetType === 'category' ? 'bg-bg-card text-text-primary shadow-sm border border-border/50' : 'text-text-muted hover:text-text-primary'}`}
          >
            App Category
          </button>
        </div>

        {/* Selection */}
        {targetType === 'app' ? (
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-2">Select App</label>
            <select
              value={appId}
              onChange={(e) => setAppId(e.target.value)}
              className="w-full rounded-xl border border-border bg-bg-elevated px-4 py-3 text-text-primary outline-none focus:border-accent"
              required={targetType === 'app'}
              disabled={loading}
            >
              <option value="" disabled>{loading ? 'Loading apps...' : 'Select an app…'}</option>
              {apps.map(a => (
                <option key={a.id} value={a.id}>{a.app_name}</option>
              ))}
            </select>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-2">Select Category</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full rounded-xl border border-border bg-bg-elevated px-4 py-3 text-text-primary outline-none focus:border-accent"
              required={targetType === 'category'}
            >
              <option value="" disabled>Select a category…</option>
              {CATEGORIES.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
        )}

        {/* Daily Limit Slider */}
        <div>
          <label className="block text-sm font-semibold text-text-primary mb-4">Daily Limit</label>
          <div className="flex items-center gap-4 bg-bg-elevated/50 p-6 rounded-2xl border border-border/50">
            <input
              type="range"
              min={15}
              max={480}
              step={15}
              value={limitMinutes}
              onChange={(e) => setLimitMinutes(Number(e.target.value))}
              className="flex-1 accent-violet-500"
            />
            <div className="w-20 text-center rounded-xl bg-violet-500/10 py-2 border border-violet-500/20">
              <span className="text-lg font-bold text-violet-400">{formatMinutes(limitMinutes)}</span>
            </div>
          </div>
        </div>

        {/* Weekly Budget */}
        <div className="rounded-2xl border border-border bg-bg-elevated/30 p-5 space-y-4">
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              id="weekly-budget-toggle"
              type="checkbox"
              checked={weeklyEnabled}
              onChange={(e) => setWeeklyEnabled(e.target.checked)}
              className="w-4 h-4 accent-indigo-400 rounded"
            />
            <div>
              <span className="text-sm font-semibold text-text-primary">📅 Set weekly budget</span>
              <p className="text-xs text-text-muted mt-0.5">Cap total usage across the rolling 7-day window</p>
            </div>
          </label>

          {weeklyEnabled && (
            <div className="space-y-2 pt-1">
              <label className="block text-sm font-semibold text-text-primary">
                Weekly limit — <span className="text-indigo-400">{weeklyLimitHours}h ({weeklyLimitHours * 60} min)</span>
              </label>
              <div className="flex items-center gap-4">
                <input
                  id="weekly-limit-slider"
                  type="range"
                  min={1}
                  max={56}
                  step={1}
                  value={weeklyLimitHours}
                  onChange={(e) => setWeeklyLimitHours(Number(e.target.value))}
                  className="flex-1 accent-indigo-400"
                />
                <div className="w-16 text-center rounded-xl bg-indigo-500/10 py-2 border border-indigo-500/20">
                  <span className="text-base font-bold text-indigo-400">{weeklyLimitHours}h</span>
                </div>
              </div>
              {weeklyLimitHours * 60 < limitMinutes && (
                <p className="text-xs text-amber-400">⚠️ Weekly limit should be at least as large as the daily limit.</p>
              )}
            </div>
          )}
        </div>

        <div className="pt-4 flex gap-3">
          <Link href="/rules" className="flex-1 text-center rounded-xl border border-border px-4 py-3 font-semibold text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving || (targetType === 'app' ? !appId : !categoryId) || !selectedChildId}
            className="flex-[2] rounded-xl bg-violet-500 py-3 font-semibold text-white hover:bg-violet-600 transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Create Time Limit'}
          </button>
        </div>

      </form>
    </div>
  );
}
