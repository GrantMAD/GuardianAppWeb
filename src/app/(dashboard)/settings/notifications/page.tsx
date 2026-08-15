'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useFamilyStore } from '@/store/familyStore';
import { getNotificationPreferences, updateNotificationPreferences } from '@/lib/parent-service';
import { useToast } from '@/hooks/useToast';

interface NotifSetting {
  key: keyof Omit<import('@/types').NotificationPreference, 'id' | 'family_id' | 'created_at' | 'updated_at'>;
  label: string;
  description: string;
}

const SETTING_DEFS: NotifSetting[] = [
  { key: 'weekly_reports', label: 'Weekly Reports', description: 'Sunday evening weekly usage recap' },
  { key: 'permission_requests', label: 'Permission Requests', description: 'When a child asks for more time or app unblock' },
  { key: 'app_installs', label: 'App Installs', description: 'When a child installs a new app on their device' },
  { key: 'system_alerts', label: 'System Alerts', description: 'Important system updates and limit warnings' },
];

export default function NotificationSettingsPage() {
  const { family } = useFamilyStore();
  const { toast } = useToast();
  const [preferences, setPreferences] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    if (!family) return;
    setLoading(true);
    getNotificationPreferences(family.id)
      .then((prefs) => {
        if (prefs) {
          setPreferences(prefs as any);
        } else {
          // Defaults if no prefs found
          const defaults: Record<string, boolean> = {};
          SETTING_DEFS.forEach(s => defaults[s.key] = true);
          setPreferences(defaults);
        }
      })
      .catch(() => toast.error('Failed to load notification preferences'))
      .finally(() => setLoading(false));
  }, [family]);

  const toggle = async (key: string) => {
    if (!family || saving) return;
    setSaving(key);
    const newValue = !preferences[key];
    
    // Optimistic update
    setPreferences(prev => ({ ...prev, [key]: newValue }));
    
    try {
      await updateNotificationPreferences(family.id, { [key]: newValue });
    } catch (err) {
      // Revert on error
      setPreferences(prev => ({ ...prev, [key]: !newValue }));
      toast.error('Failed to save preference');
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <Link href="/settings" className="text-sm text-text-muted hover:text-text-primary transition-colors inline-block mb-4">
          ← Back to Settings
        </Link>
        <p className="text-xs uppercase tracking-[0.3em] text-accent font-medium">Preferences</p>
        <h1 className="text-3xl font-bold text-text-primary mt-1">🔔 Notifications</h1>
        <p className="mt-1 text-text-muted text-sm">Choose which email alerts and dashboard notifications you want to receive.</p>
      </div>

      <div className="rounded-2xl border border-border bg-bg-card divide-y divide-slate-800/60 overflow-hidden relative">
        {loading && (
          <div className="absolute inset-0 bg-bg-card/50 backdrop-blur-sm z-10 flex items-center justify-center">
             <div className="w-8 h-8 border-2 border-border border-t-accent rounded-full animate-spin" />
          </div>
        )}
        
        {SETTING_DEFS.map((s) => (
          <div key={s.key} className="flex items-center justify-between p-5 hover:bg-bg-elevated/30 transition-colors">
            <div className="pr-4">
              <p className="text-sm font-semibold text-text-primary">{s.label}</p>
              <p className="text-xs text-text-muted mt-1">{s.description}</p>
            </div>
            
            {/* Custom Toggle Switch */}
            <button
              onClick={() => toggle(s.key)}
              disabled={saving === s.key}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 ${
                preferences[s.key] !== false ? 'bg-accent' : 'bg-bg-elevated'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  preferences[s.key] !== false ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        ))}
      </div>
      
      <div className="rounded-2xl bg-accent/10 border border-accent/20 p-4">
        <p className="text-accent text-xs text-center">
          Note: Since this is the web dashboard, alerts will appear in your notification inbox.
        </p>
      </div>
    </div>
  );
}
