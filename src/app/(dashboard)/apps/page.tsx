'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useFamilyStore } from '@/store/familyStore';
import { getInstalledApps } from '@/lib/usage-service';
import { getRules } from '@/lib/rule-service';
import { SkeletonCard } from '@/components/ui/Skeleton';
import type { InstalledApp, Rule } from '@/types';
import { CATEGORY_COLORS } from '@/lib/utils';
import { useToast } from '@/hooks/useToast';

const CATEGORIES = [
  { value: 'all', label: 'All' },
  { value: 'social', label: '💬 Social' },
  { value: 'games', label: '🎮 Games' },
  { value: 'entertainment', label: '📺 Entertainment' },
  { value: 'education', label: '📚 Education' },
  { value: 'productivity', label: '💼 Productivity' },
  { value: 'other', label: '📦 Other' },
];


type RuleStatus = 'blocked' | 'limited' | 'none';

export default function AppsPage() {
  const { selectedChildId, children } = useFamilyStore();
  const selectedChild = children.find((c) => c.id === selectedChildId);
  const { toast } = useToast();

  const [apps, setApps] = useState<InstalledApp[]>([]);
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');

  useEffect(() => {
    if (!selectedChildId) return;
    setLoading(true);
    Promise.all([getInstalledApps(selectedChildId), getRules(selectedChildId)])
      .then(([installedApps, appRules]) => {
        setApps((installedApps ?? []) as InstalledApp[]);
        setRules(appRules);
      })
      .catch(() => toast.error('Failed to load apps'))
      .finally(() => setLoading(false));
  }, [selectedChildId]);

  const getRuleStatus = (appId: string): RuleStatus => {
    const appRules = rules.filter((r) => r.app_id === appId);
    if (appRules.some((r) => r.rule_type === 'BLOCK')) return 'blocked';
    if (appRules.some((r) => r.rule_type === 'TIME_LIMIT')) return 'limited';
    return 'none';
  };

  const filtered = apps.filter((a) => {
    const matchSearch = a.app_name.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === 'all' || a.category === category;
    return matchSearch && matchCat;
  });

  const statusBadge = (status: RuleStatus) => {
    if (status === 'blocked') return (
      <span className="rounded-full bg-red-500/15 border border-red-500/30 px-2 py-0.5 text-[10px] font-semibold text-red-400">
        Blocked
      </span>
    );
    if (status === 'limited') return (
      <span className="rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] font-semibold text-amber-400">
        Limited
      </span>
    );
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-accent font-medium">Installed Apps</p>
        <h1 className="text-3xl font-bold text-text-primary mt-1">📱 Apps</h1>
        {selectedChild && (
          <p className="mt-1 text-text-muted text-sm">
            View and manage all applications on {selectedChild.name}'s device.
          </p>
        )}
      </div>

      {!selectedChildId ? (
        <div className="rounded-2xl border border-dashed border-border bg-bg-card/60 p-10 text-center">
          <p className="text-3xl mb-2">👶</p>
          <p className="text-text-primary font-semibold">No child selected</p>
          <p className="text-text-muted text-sm mt-1">Select a child from the sidebar to see their apps.</p>
        </div>
      ) : (
        <>
          {/* Search */}
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search apps…"
            className="w-full rounded-xl border border-border bg-bg-card px-4 py-3 text-sm text-text-primary placeholder-slate-500 outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all"
          />

          {/* Category chips */}
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setCategory(cat.value)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all border ${
                  category === cat.value
                    ? 'bg-accent/20 border-accent/40 text-accent'
                    : 'bg-bg-card border-border text-text-muted hover:border-text-muted hover:text-text-primary'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* App grid */}
          {loading ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 mt-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-text-muted">
              <p className="text-3xl mb-2">🔍</p>
              <p className="text-sm">{apps.length === 0 ? 'No apps synced yet from child device.' : 'No apps match your search.'}</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((app) => {
                const status = getRuleStatus(app.id);
                const color = CATEGORY_COLORS[app.category] ?? '#9E9E9E';
                return (
                  <Link
                    key={app.id}
                    href={`/apps/${app.id}`}
                    className={`flex items-center gap-3 rounded-2xl border p-4 transition-all hover:scale-[1.01] active:scale-100 group ${
                      status === 'blocked'
                        ? 'border-red-500/20 bg-red-500/5 hover:border-red-500/30'
                        : status === 'limited'
                        ? 'border-amber-500/20 bg-amber-500/5 hover:border-amber-500/30'
                        : 'border-border bg-bg-card hover:border-border'
                    }`}
                  >
                    {/* App icon */}
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-xl font-bold text-text-primary"
                      style={{ backgroundColor: color + '33', border: `1px solid ${color}55` }}
                    >
                      {app.icon_url
                        ? <img src={app.icon_url} alt={app.app_name} className="w-9 h-9 rounded-lg object-contain" loading="lazy" />
                        : app.app_name.charAt(0).toUpperCase()
                      }
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-text-primary truncate group-hover:text-accent transition-colors">
                        {app.app_name}
                      </p>
                      <p className="text-xs text-text-muted capitalize">{app.category}</p>
                    </div>

                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      {statusBadge(status)}
                      <span className="text-slate-600 text-sm">›</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
