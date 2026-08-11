'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { updatePermissionRequestStatus } from '@/lib/dashboard-service';
import { useFamilyStore } from '@/store/familyStore';
import { logParentAction } from '@/lib/parent-service';

interface RequestItem {
  id: string;
  child: string;
  message: string;
  status: string;
}

interface RequestsPanelProps {
  requests: RequestItem[];
}

export function RequestsPanel({ requests }: RequestsPanelProps) {
  const router = useRouter();
  const { family } = useFamilyStore();
  const [visibleRequests, setVisibleRequests] = useState(requests);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setVisibleRequests(requests);
  }, [requests]);

  async function handleDecision(requestId: string, nextStatus: 'approved' | 'denied') {
    setUpdatingId(requestId);
    setError(null);

    try {
      await updatePermissionRequestStatus(requestId, nextStatus);
      if (family) {
        await logParentAction(family.id, 'REQUEST_' + nextStatus.toUpperCase(), `Permission request ${nextStatus}`);
      }
      setVisibleRequests((current) => current.filter((request) => request.id !== requestId));
      router.refresh();
    } catch {
      setError('Unable to update that request right now.');
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-bg-card p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Permission requests</h2>
          <p className="text-sm text-text-muted">Review and respond to your child’s recent requests.</p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {visibleRequests.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-bg-elevated/40 p-4 text-sm text-text-muted">
            No pending permission requests right now.
          </div>
        ) : (
          visibleRequests.map((request) => (
            <div key={request.id} className="rounded-xl border border-border bg-bg-elevated/60 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{request.child}</p>
                  <p className="mt-1 text-sm text-text-muted">{request.message}</p>
                </div>
                <span className="rounded-full bg-accent/10 px-3 py-1 text-sm text-accent">{request.status}</span>
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  className="rounded-lg bg-accent px-3 py-2 text-sm font-medium text-bg-primary disabled:cursor-not-allowed disabled:opacity-70"
                  onClick={() => handleDecision(request.id, 'approved')}
                  disabled={updatingId === request.id}
                >
                  {updatingId === request.id ? 'Working…' : 'Approve'}
                </button>
                <button
                  className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-text-primary disabled:cursor-not-allowed disabled:opacity-70"
                  onClick={() => handleDecision(request.id, 'denied')}
                  disabled={updatingId === request.id}
                >
                  {updatingId === request.id ? 'Working…' : 'Deny'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {error ? <p className="mt-4 text-sm text-rose-400">{error}</p> : null}
    </div>
  );
}
