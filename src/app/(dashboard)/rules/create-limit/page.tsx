'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useFamilyStore } from '@/store/familyStore';
import { getInstalledApps } from '@/lib/usage-service';
import { createTimeLimitRule, logParentAction } from '@/lib/parent-service';
import type { InstalledApp } from '@/types';
import Link from 'next/link';

function formatMinutes(mins: number) {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export default function CreateLimitPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { children, selectedChildId, setSelectedChildId, family } = useFamilyStore();
  
  const [apps, setApps] = useState<InstalledApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [appId, setAppId] = useState(searchParams.get('appId') || '');
  const [limitMinutes, setLimitMinutes] = useState(60);

  useEffect(() => {
    if (!selectedChildId) return;
    setLoading(true);
    getInstalledApps(selectedChildId)
      .then((a) => setApps((a ?? []) as InstalledApp[]))
      .finally(() => setLoading(false));
  }, [selectedChildId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChildId || !appId) return;
    
    setSaving(true);
    try {
      await createTimeLimitRule({
        child_id: selectedChildId,
        app_id: appId,
        daily_limit_minutes: limitMinutes,
      });
      if (family) {
        await logParentAction(
          family.id,
          'RULE_CREATED',
          `Created a time limit rule of ${limitMinutes} minutes`
        );
      }
      router.push('/rules');
    } catch (err) {
      console.error(err);
      alert('Failed to save time limit');
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

        {/* App Selection */}
        <div>
          <label className="block text-sm font-semibold text-text-primary mb-2">Select App</label>
          <select
            value={appId}
            onChange={(e) => setAppId(e.target.value)}
            className="w-full rounded-xl border border-border bg-bg-elevated px-4 py-3 text-text-primary outline-none focus:border-accent"
            required
            disabled={loading}
          >
            <option value="" disabled>{loading ? 'Loading apps...' : 'Select an app…'}</option>
            {apps.map(a => (
              <option key={a.id} value={a.id}>{a.app_name}</option>
            ))}
          </select>
        </div>

        {/* Limit Slider */}
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

        <div className="pt-4 flex gap-3">
          <Link href="/rules" className="flex-1 text-center rounded-xl border border-border px-4 py-3 font-semibold text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving || !appId || !selectedChildId}
            className="flex-[2] rounded-xl bg-violet-500 py-3 font-semibold text-white hover:bg-violet-600 transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Create Time Limit'}
          </button>
        </div>

      </form>
    </div>
  );
}
