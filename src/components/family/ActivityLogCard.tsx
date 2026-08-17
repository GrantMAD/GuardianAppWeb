'use client';

import { useEffect, useState } from 'react';
import { useFamilyStore } from '@/store/familyStore';
import { getParentActivityLogs } from '@/lib/parent-service';
import { useToast } from '@/hooks/useToast';
import type { AuditLogEntry } from '@/types';

export function ActivityLogCard() {
  const { family } = useFamilyStore();
  const { toast } = useToast();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!family) return;
    setLoading(true);
    getParentActivityLogs(family.id)
      .then(setLogs)
      .catch(() => toast.error('Failed to load activity log'))
      .finally(() => setLoading(false));
  }, [family]);

  return (
    <div className="rounded-2xl border border-border bg-bg-card p-6">
      <h2 className="text-lg font-semibold">Parent activity log</h2>
      <p className="mt-2 text-sm text-text-muted">Recent actions taken from the parent dashboard.</p>

      <div className="mt-4 space-y-3">
        {loading ? (
          <p className="text-sm text-text-muted py-4 text-center border border-dashed border-border rounded-xl">Loading logs...</p>
        ) : logs.length === 0 ? (
          <p className="text-sm text-text-muted py-4 text-center border border-dashed border-border rounded-xl">No recent activity.</p>
        ) : (
          <>
            {logs.slice(0, 5).map((entry) => (
              <div key={entry.id} className="rounded-xl border border-border bg-bg-elevated/60 p-3">
                <p className="font-medium text-sm text-text-primary">{entry.description}</p>
                <p className="mt-1 text-[11px] text-text-muted uppercase tracking-wider">
                  {new Date(entry.created_at).toLocaleString()}
                </p>
              </div>
            ))}
            <div className="pt-2">
              <a href="/settings/activity-log" className="block w-full py-2.5 rounded-xl border border-border bg-bg-elevated/30 text-center text-sm font-semibold text-text-primary hover:bg-bg-elevated/60 hover:text-accent transition-all">
                View all activity
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
