'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useFamilyStore } from '@/store/familyStore';
import { getCurrentUser } from '@/lib/auth-service';

export default function SettingsPage() {
  const router = useRouter();
  const { family, children } = useFamilyStore();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    getCurrentUser().then(user => {
      if (user) setEmail(user.email ?? null);
    });
  }, []);

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-400 font-medium">Configuration</p>
        <h1 className="text-3xl font-bold text-white mt-1">⚙️ Settings</h1>
        <p className="mt-1 text-slate-400 text-sm">Manage your family account, child profiles, and preferences.</p>
      </div>

      {/* Account Card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-bold text-xl flex-shrink-0">
          {email?.charAt(0).toUpperCase() ?? '?'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-base font-semibold text-white truncate">{family?.name ?? 'My Family'}</p>
          <p className="text-sm text-slate-400 truncate">{email ?? 'Loading…'}</p>
        </div>
      </div>

      {/* Children Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
            👥 Children <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-400">{children.length}</span>
          </h2>
          <Link
            href="/settings/add-child"
            className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            + Add Child
          </Link>
        </div>

        {children.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/60 p-8 text-center">
            <p className="text-slate-400 text-sm mb-3">No children added yet.</p>
            <Link
              href="/settings/add-child"
              className="inline-block rounded-xl bg-cyan-500/15 border border-cyan-500/30 px-4 py-2 text-xs font-semibold text-cyan-400 hover:bg-cyan-500/25 transition-all"
            >
              + Add your first child
            </Link>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 divide-y divide-slate-800/60">
            {children.map((child) => (
              <Link
                key={child.id}
                href={`/settings/child/${child.id}`}
                className="flex items-center gap-3 p-4 hover:bg-slate-800/50 transition-colors group"
              >
                <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-sm font-bold text-slate-300 flex-shrink-0 overflow-hidden">
                  {child.avatar_url
                    ? <img src={child.avatar_url} alt={child.name} className="w-full h-full object-cover" />
                    : child.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white group-hover:text-cyan-400 transition-colors">{child.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {child.is_active ? '✅ Active' : '⚫ Inactive'} • {child.device_name ?? 'No device'}
                  </p>
                </div>
                <span className="text-slate-500 group-hover:text-cyan-400 transition-colors">›</span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* General Settings */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-4">
        <h2 className="text-sm font-semibold text-slate-300 mb-2">⚙️ General & Legal</h2>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
            <span className="text-slate-400">🎨 Theme Mode</span>
            <span className="text-slate-300 capitalize">{family?.theme ?? 'dark'}</span>
          </div>
          <Link href="/settings/privacy" className="flex justify-between items-center py-1 border-b border-slate-800/60 text-slate-400 hover:text-white transition-colors">
            <span>🔒 Privacy Policy</span>
            <span>›</span>
          </Link>
          <Link href="/settings/terms" className="flex justify-between items-center py-1 border-b border-slate-800/60 text-slate-400 hover:text-white transition-colors">
            <span>📜 Terms of Service</span>
            <span>›</span>
          </Link>
        </div>
      </div>

      {/* Account / Sign out */}
      <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-white">Sign Out</p>
          <p className="text-xs text-slate-400 mt-0.5">Sign out of your parent account on this browser.</p>
        </div>
        <button
          onClick={async () => {
            const { signOut } = await import('@/lib/auth-service');
            await signOut();
            router.replace('/login');
          }}
          className="rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/20 transition-all"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
