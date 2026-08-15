'use client';

import { useEffect, useState, useCallback } from 'react';
import { useFamilyStore } from '@/store/familyStore';
import { getNotifications, markNotificationsRead } from '@/lib/notification-service';
import type { NotificationLog } from '@/types';
import { useToast } from '@/hooks/useToast';

const TYPE_ICONS: Record<string, string> = {
  request_received: '💬',
  limit_warning:    '⚠️',
  app_blocked:      '🔒',
  daily_report:     '📊',
  parent_welcome:   '🎉',
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function NotificationsPage() {
  const { family } = useFamilyStore();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!family) return;
    try {
      const data = await getNotifications(family.id);
      setNotifications(data);
      // Mark unread as read
      const unread = data.filter((n) => !n.is_read).map((n) => n.id);
      if (unread.length > 0) markNotificationsRead(unread);
    } catch (err) {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [family]);

  useEffect(() => { load(); }, [load]);

  const handleRefresh = () => {
    setRefreshing(true);
    load();
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-accent font-medium">Activity</p>
          <h1 className="text-3xl font-bold text-text-primary mt-1">
            🔔 Notifications
            {unreadCount > 0 && (
              <span className="ml-3 rounded-full bg-accent/20 border border-accent/40 px-2 py-0.5 text-sm font-semibold text-accent">
                {unreadCount} new
              </span>
            )}
          </h1>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="rounded-xl border border-border bg-bg-card px-3 py-2 text-sm text-text-muted hover:text-text-primary hover:border-text-muted transition-all disabled:opacity-50"
        >
          {refreshing ? '⟳ Refreshing…' : '⟳ Refresh'}
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-600">
          <div className="w-8 h-8 border-2 border-border border-t-accent rounded-full animate-spin mb-3" />
          <p className="text-sm">Loading notifications…</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-bg-card/60 py-20 text-center">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-text-primary font-semibold">All caught up!</p>
          <p className="text-text-muted text-sm mt-1">No notifications right now.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className={`flex gap-4 rounded-2xl border p-4 transition-all ${
                notif.is_read
                  ? 'border-border bg-bg-card'
                  : 'border-accent/20 bg-accent/5'
              }`}
            >
              {/* Icon */}
              <div className="w-10 h-10 rounded-full bg-bg-elevated border border-border flex items-center justify-center text-xl flex-shrink-0">
                {TYPE_ICONS[notif.type] ?? '🔔'}
              </div>

              {/* Body */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text-primary">{notif.title}</p>
                <p className="text-sm text-text-muted mt-0.5 leading-relaxed">{notif.body}</p>
                <p className="text-xs text-slate-600 mt-1.5">{timeAgo(notif.sent_at)}</p>
              </div>

              {/* Unread dot */}
              {!notif.is_read && (
                <div className="w-2 h-2 rounded-full bg-accent mt-1.5 flex-shrink-0" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
