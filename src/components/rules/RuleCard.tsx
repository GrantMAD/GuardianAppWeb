'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateRuleStatus } from '@/lib/dashboard-service';

interface RuleCardProps {
  rule: {
    id: string;
    name: string;
    type: string;
    enabled: boolean;
  };
}

export function RuleCard({ rule }: RuleCardProps) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(rule.enabled);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setEnabled(rule.enabled);
  }, [rule.enabled]);

  async function handleToggle(nextEnabled: boolean) {
    setSaving(true);
    setError(null);

    try {
      await updateRuleStatus(rule.id, nextEnabled);
      setEnabled(nextEnabled);
      router.refresh();
    } catch {
      setError('Unable to update this rule right now.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-semibold">{rule.name}</p>
          <p className="text-sm text-slate-400">{rule.type} rule</p>
        </div>
        <label className="inline-flex cursor-pointer items-center">
          <input
            type="checkbox"
            checked={enabled}
            disabled={saving}
            onChange={(event) => handleToggle(event.target.checked)}
            className="peer sr-only"
          />
          <span className="h-6 w-11 rounded-full bg-slate-700 transition peer-checked:bg-cyan-500" />
          <span className="ml-2 text-sm text-slate-400">{enabled ? 'On' : 'Off'}</span>
        </label>
      </div>
      {error ? <p className="mt-3 text-sm text-rose-400">{error}</p> : null}
    </div>
  );
}
