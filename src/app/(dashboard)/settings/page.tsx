'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useFamilyStore } from '@/store/familyStore';
import { getCurrentUser } from '@/lib/auth-service';
import { ActivityLogCard } from '@/components/family/ActivityLogCard';
import { useToast } from '@/hooks/useToast';

export default function SettingsPage() {
  const router = useRouter();
  const { family, children } = useFamilyStore();
  const { toast } = useToast();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    getCurrentUser().then(user => {
      if (user) setEmail(user.email ?? null);
    });
  }, []);

  const handleToggleTheme = async () => {
    if (!family) return;
    const newTheme = family.theme === 'light' ? 'dark' : 'light';
    const { updateFamilyTheme } = await import('@/lib/child-service');
    
    // Optimistic update
    useFamilyStore.getState().setFamily({ ...family, theme: newTheme });
    
    try {
      await updateFamilyTheme(family.id, newTheme);
    } catch (err) {
      useFamilyStore.getState().setFamily({ ...family });
      toast.error('Failed to update theme');
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-accent font-medium">Configuration</p>
        <h1 className="text-3xl font-bold text-text-primary mt-1">⚙️ Settings</h1>
        <p className="mt-1 text-text-muted text-sm">Manage your family account, child profiles, and preferences.</p>
      </div>

      {/* Account Card */}
      <div className="rounded-2xl border border-border bg-bg-card p-5 flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-accent/20 border border-accent/40 flex items-center justify-center text-accent font-bold text-xl flex-shrink-0">
          {email?.charAt(0).toUpperCase() ?? '?'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-base font-semibold text-text-primary truncate">{family?.name ?? 'My Family'}</p>
          <p className="text-sm text-text-muted truncate">{email ?? 'Loading…'}</p>
        </div>
      </div>

      {/* Children Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
            👥 Children <span className="rounded-full bg-bg-elevated px-2 py-0.5 text-xs text-text-muted">{children.length}</span>
          </h2>
          <Link
            href="/settings/add-child"
            className="text-xs font-semibold text-accent hover:text-accent transition-colors"
          >
            + Add Child
          </Link>
        </div>

        {children.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-bg-card/60 p-8 text-center">
            <p className="text-text-muted text-sm mb-3">No children added yet.</p>
            <Link
              href="/settings/add-child"
              className="inline-block rounded-xl bg-accent/15 border border-accent/30 px-4 py-2 text-xs font-semibold text-accent hover:bg-accent/25 transition-all"
            >
              + Add your first child
            </Link>
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-bg-card divide-y divide-slate-800/60">
            {children.map((child) => (
              <Link
                key={child.id}
                href={`/settings/child/${child.id}`}
                className="flex items-center gap-3 p-4 hover:bg-bg-elevated/50 transition-colors group"
              >
                <div className="w-10 h-10 rounded-full bg-bg-elevated flex items-center justify-center text-sm font-bold text-text-primary flex-shrink-0 overflow-hidden">
                  {child.avatar_url
                    ? <img src={child.avatar_url} alt={child.name} className="w-full h-full object-cover" loading="lazy" />
                    : child.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text-primary group-hover:text-accent transition-colors">{child.name}</p>
                  <p className="text-xs text-text-muted mt-0.5">
                    {child.is_active ? '✅ Active' : '⚫ Inactive'} • {child.device_name ?? 'No device'}
                  </p>
                </div>
                <span className="text-text-muted group-hover:text-accent transition-colors">›</span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* General Settings */}
      <div className="rounded-2xl border border-border bg-bg-card p-6 space-y-4">
        <h2 className="text-sm font-semibold text-text-primary mb-2">⚙️ General & Legal</h2>
        <div className="space-y-3 text-sm">
          <button onClick={handleToggleTheme} className="w-full flex justify-between items-center py-2 border-b border-border/60 hover:text-text-primary transition-colors">
            <span className="text-text-muted">🎨 Theme Mode</span>
            <span className="text-text-primary capitalize">{family?.theme ?? 'dark'}</span>
          </button>
          <Link href="/settings/notifications" className="flex justify-between items-center py-1 border-b border-border/60 text-text-muted hover:text-text-primary transition-colors">
            <span>🔔 Notification Preferences</span>
            <span>›</span>
          </Link>
          <Link href="/settings/privacy" className="flex justify-between items-center py-1 border-b border-border/60 text-text-muted hover:text-text-primary transition-colors">
            <span>🔒 Privacy Policy</span>
            <span>›</span>
          </Link>
          <Link href="/settings/terms" className="flex justify-between items-center py-1 border-b border-border/60 text-text-muted hover:text-text-primary transition-colors">
            <span>📜 Terms of Service</span>
            <span>›</span>
          </Link>
        </div>
      </div>

      {/* Activity Log */}
      <ActivityLogCard />

    </div>
  );
}
