'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useFamilyStore } from '@/store/familyStore';
import { useFamilyBootstrap } from '@/hooks/useFamilyBootstrap';
import { signOut } from '@/lib/auth-service';
import { getDailyScreenTimeSummary } from '@/lib/usage-service';
import { useState, useEffect } from 'react';

function formatMinsShort(mins: number) {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

const navItems = [
  { href: '/',              label: 'Overview',      icon: '🏠' },
  { href: '/apps',          label: 'Apps',          icon: '📱' },
  { href: '/rules',         label: 'Rules',         icon: '⚙️' },
  { href: '/reports',       label: 'Reports',       icon: '📈' },
  { href: '/notifications', label: 'Notifications', icon: '🔔' },
  { href: '/settings',      label: 'Settings',      icon: '👤' },
];

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { family, children: kids, selectedChildId, setSelectedChildId } = useFamilyStore();
  const [signingOut, setSigningOut] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [familySummaries, setFamilySummaries] = useState<Record<string, number>>({});

  const todayDate = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    if (!kids.length) return;
    Promise.all(
      kids.map(c =>
        getDailyScreenTimeSummary(c.id, todayDate)
          .then(res => ({ id: c.id, mins: res?.total_minutes ?? 0 }))
          .catch(() => ({ id: c.id, mins: 0 }))
      )
    ).then(results => {
      const sums: Record<string, number> = {};
      results.forEach(r => { sums[r.id] = r.mins; });
      setFamilySummaries(sums);
    });
  }, [kids, todayDate]);

  // Bootstrap family data on first render
  useFamilyBootstrap();

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
      router.replace('/login');
    } catch {
      setSigningOut(false);
    }
  };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const today = DAY_LABELS[new Date().getDay()];

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">
      <div className="flex min-h-screen flex-col lg:flex-row">

        {/* ─── Sidebar ──────────────────────────────────────────────── */}
        <aside
          className={`
            fixed inset-y-0 left-0 z-40 border-r border-border
            bg-bg-card/95 backdrop-blur-xl flex flex-col relative
            transition-all duration-300
            ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
            lg:translate-x-0 lg:static lg:flex
            ${isCollapsed ? 'lg:w-20' : 'lg:w-72'}
            w-72
          `}
        >
          {/* Edge Collapse Button (Half on sidebar, half off) */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex absolute -right-3.5 top-7 z-50 items-center justify-center w-7 h-7 rounded-full bg-bg-elevated border border-border text-text-primary hover:text-text-primary hover:bg-bg-elevated shadow-md transition-all duration-200 hover:scale-110"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            <span className="text-[10px] font-bold">
              {isCollapsed ? '▶' : '◀'}
            </span>
          </button>

          {/* Brand */}
          <div className="px-5 py-6 border-b border-border flex items-center justify-between min-h-[85px]">
            {!isCollapsed ? (
              <div className="min-w-0 flex-1 pr-2">
                <p className="text-xs uppercase tracking-[0.3em] text-accent font-medium truncate">Guardian Web</p>
                <h2 className="mt-0.5 text-lg font-bold text-text-primary truncate">Parent Dashboard</h2>
                {family && (
                  <p className="mt-0.5 text-xs text-text-muted truncate">
                    {greeting()}, {family.name}
                  </p>
                )}
              </div>
            ) : (
              <div className="w-full flex items-center justify-center">
                <span className="text-xl">🛡️</span>
              </div>
            )}
          </div>

          {/* Child selector */}
          {kids.length > 0 && (
            <div className={`py-4 border-b border-border ${isCollapsed ? 'px-2' : 'px-4'}`}>
              {!isCollapsed && (
                <p className="text-xs text-text-muted uppercase tracking-wider mb-2 px-2 font-medium">Active child</p>
              )}
              <div className="space-y-1">
                {kids.map((child) => {
                  const isSelected = selectedChildId === child.id;
                  return (
                    <button
                      key={child.id}
                      onClick={() => setSelectedChildId(child.id)}
                      title={child.name}
                      className={`w-full flex items-center gap-3 rounded-xl transition-all ${
                        isCollapsed ? 'p-2 justify-center' : 'px-3 py-2.5 text-sm'
                      } ${
                        isSelected
                          ? 'bg-accent/15 border border-accent/30 text-accent'
                          : 'text-text-primary hover:bg-bg-elevated border border-transparent'
                      }`}
                    >
                      <div className={`
                        w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
                        ${isSelected ? 'bg-accent/30 text-accent' : 'bg-bg-elevated text-text-primary'}
                      `}>
                        {child.avatar_url
                          ? <img src={child.avatar_url} alt={child.name} className="w-full h-full rounded-full object-cover" />
                          : child.name.charAt(0).toUpperCase()
                        }
                      </div>
                      {!isCollapsed && (
                        <>
                          <div className="min-w-0 flex-1">
                            <span className="font-medium truncate block">{child.name}</span>
                            <span className={`text-[11px] tabular-nums ${
                              isSelected ? 'text-accent/70' : 'text-text-muted'
                            }`}>
                              {familySummaries[child.id] !== undefined
                                ? `${formatMinsShort(familySummaries[child.id])} today`
                                : '—'}
                            </span>
                          </div>
                          <span className={`ml-auto w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0 transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0'}`} />
                        </>
                      )}
                    </button>
                  );
                })}

                <Link
                  href="/settings"
                  title="Add child"
                  className={`w-full flex items-center rounded-xl text-text-muted hover:text-text-primary transition-colors border border-dashed border-border hover:border-text-muted mt-1 ${
                    isCollapsed ? 'p-2 justify-center text-sm' : 'gap-3 px-3 py-2 text-xs'
                  }`}
                >
                  <span className="text-base font-bold">+</span>
                  {!isCollapsed && <span>Add child</span>}
                </Link>
              </div>
            </div>
          )}

          {/* Nav */}
          <nav className={`flex-1 py-4 space-y-1 overflow-y-auto ${isCollapsed ? 'px-2' : 'px-4'}`}>
            {navItems.map((item) => {
              const active = item.href === '/'
                ? pathname === '/'
                : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={item.label}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center rounded-xl font-medium transition-all ${
                    isCollapsed ? 'p-3 justify-center text-lg' : 'gap-3 px-3 py-2.5 text-sm'
                  } ${
                    active
                      ? 'bg-accent/15 border border-accent/30 text-accent'
                      : 'text-text-muted hover:bg-bg-elevated hover:text-text-primary border border-transparent'
                  }`}
                >
                  <span className="w-6 flex justify-center text-base flex-shrink-0">{item.icon}</span>
                  {!isCollapsed && <span>{item.label}</span>}
                </Link>
              );
            })}
          </nav>

          {/* Sign out */}
          <div className={`py-4 border-t border-border ${isCollapsed ? 'px-2' : 'px-4'}`}>
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              title="Sign Out"
              className={`w-full flex items-center rounded-xl text-red-500 bg-red-500/5 hover:bg-red-500/10 hover:text-red-400 border border-red-500/20 hover:border-red-500/30 transition-all disabled:opacity-50 ${
                isCollapsed ? 'p-3 justify-center text-lg' : 'gap-3 px-3 py-2.5 text-sm font-medium'
              }`}
            >
              <span className="w-6 flex justify-center text-base flex-shrink-0">🚪</span>
              {!isCollapsed && <span>{signingOut ? 'Signing out…' : 'Sign Out'}</span>}
            </button>
          </div>
        </aside>

        {/* Mobile overlay */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/60 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* ─── Main content ──────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Mobile topbar */}
          <header className="sticky top-0 z-20 flex items-center justify-between px-4 py-3 border-b border-border bg-bg-primary/90 backdrop-blur-xl lg:hidden">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="p-2 rounded-lg bg-bg-elevated text-text-primary"
              >
                ☰
              </button>
              <p className="text-sm font-semibold text-text-primary">Guardian Web</p>
            </div>
          </header>

          <main className="flex-1 p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
