'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useFamilyStore } from '@/store/familyStore';
import { getInstalledApps } from '@/lib/usage-service';
import { createBlockRule, logParentAction } from '@/lib/parent-service';
import type { InstalledApp } from '@/types';
import Link from 'next/link';
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

export default function CreateBlockPage() {
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
    
    setSaving(true);
    try {
      await createBlockRule({
        child_id: selectedChildId,
        app_id: targetType === 'app' ? appId : undefined,
        category: targetType === 'category' ? categoryId : undefined,
      });
      if (family) {
        await logParentAction(
          family.id,
          'RULE_CREATED',
          `Created a block rule`
        );
      }
      router.push('/rules');
    } catch (err) {
      toast.error('Failed to save block rule');
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
        <h1 className="text-3xl font-bold text-text-primary">🔒 Block App</h1>
        <p className="mt-1 text-text-muted text-sm">Prevent a specific app from being opened by your child.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6 rounded-3xl border border-border bg-bg-card p-6 md:p-8">
        
        {/* Child Selection */}
        <div>
          <label className="block text-sm font-semibold text-text-primary mb-2">Apply to</label>
          <select
            value={selectedChildId || ''}
            onChange={(e) => setSelectedChildId(e.target.value)}
            className="w-full rounded-xl border border-border bg-bg-elevated px-4 py-3 text-text-primary outline-none focus:border-red-500/50"
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
            <label className="block text-sm font-semibold text-text-primary mb-2">Select App to Block</label>
            <select
              value={appId}
              onChange={(e) => setAppId(e.target.value)}
              className="w-full rounded-xl border border-border bg-bg-elevated px-4 py-3 text-text-primary outline-none focus:border-red-500/50"
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
            <label className="block text-sm font-semibold text-text-primary mb-2">Select Category to Block</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full rounded-xl border border-border bg-bg-elevated px-4 py-3 text-text-primary outline-none focus:border-red-500/50"
              required={targetType === 'category'}
            >
              <option value="" disabled>Select a category…</option>
              {CATEGORIES.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
        )}

        <div className="pt-4 flex gap-3">
          <Link href="/rules" className="flex-1 text-center rounded-xl border border-border px-4 py-3 font-semibold text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving || (targetType === 'app' ? !appId : !categoryId) || !selectedChildId}
            className="flex-[2] rounded-xl bg-red-500 py-3 font-semibold text-white hover:bg-red-600 transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Block'}
          </button>
        </div>

      </form>
    </div>
  );
}
