'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useFamilyStore } from '@/store/familyStore';
import { getParentActivityLogs } from '@/lib/parent-service';
import { useToast } from '@/hooks/useToast';
import type { AuditLogEntry } from '@/types';

export default function ActivityLogPage() {
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/settings" className="p-2 -ml-2 text-text-muted hover:text-text-primary transition-colors">
          <span className="text-xl">←</span>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">📋 Activity Log</h1>
          <p className="mt-1 text-text-muted text-sm">A history of rule changes and settings adjustments for your family.</p>
        </div>
      </div>

      {/* List */}
      <div className="mt-6">
        {loading ? (
          <div className="py-20 flex justify-center">
            <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : logs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-bg-card/60 p-12 text-center">
            <div className="text-4xl mb-4">📋</div>
            <h3 className="text-text-primary font-bold text-lg mb-2">No activity yet</h3>
            <p className="text-text-muted text-sm max-w-sm mx-auto">
              When you create rules or change settings, they will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map((entry) => (
              <div key={entry.id} className="rounded-xl border border-border bg-bg-card p-4 hover:bg-bg-elevated/50 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1 pr-4">
                    <p className="font-semibold text-text-primary">{entry.action_type}</p>
                  </div>
                  <p className="text-xs text-text-muted whitespace-nowrap">
                    {new Date(entry.created_at).toLocaleString('en-US', {
                      month: 'short', day: 'numeric',
                      hour: 'numeric', minute: '2-digit'
                    })}
                  </p>
                </div>
                {entry.description && (
                  <p className="text-sm text-text-muted">{entry.description}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
