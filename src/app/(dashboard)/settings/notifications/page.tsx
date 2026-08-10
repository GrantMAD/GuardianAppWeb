'use client';

import { useState } from 'react';
import Link from 'next/link';

interface NotifSetting {
  key: string;
  label: string;
  description: string;
  enabled: boolean;
}

export default function NotificationSettingsPage() {
  const [settings, setSettings] = useState<NotifSetting[]>([
    { key: 'daily_report',    label: 'Daily Report',       description: 'Morning summary of yesterday\'s usage', enabled: true  },
    { key: 'weekly_report',   label: 'Weekly Report',      description: 'Sunday evening weekly recap',           enabled: true  },
    { key: 'limit_warning',   label: 'Limit Warning',      description: 'When child is 10 min from their limit', enabled: true  },
    { key: 'threshold_alert', label: 'Threshold Alert',    description: 'When child hits 80% of daily limit',    enabled: true  },
    { key: 'late_night',      label: 'Late Night Alert',   description: 'Active usage detected past bedtime',    enabled: true  },
    { key: 'requests',        label: 'Permission Requests','description': 'When child asks for more time',       enabled: true  },
  ]);

  const toggle = (key: string) => {
    setSettings((prev) =>
      prev.map((s) => s.key === key ? { ...s, enabled: !s.enabled } : s)
    );
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

      <div className="rounded-2xl border border-border bg-bg-card divide-y divide-slate-800/60 overflow-hidden">
        {settings.map((s) => (
          <div key={s.key} className="flex items-center justify-between p-5 hover:bg-bg-elevated/30 transition-colors">
            <div className="pr-4">
              <p className="text-sm font-semibold text-text-primary">{s.label}</p>
              <p className="text-xs text-text-muted mt-1">{s.description}</p>
            </div>
            
            {/* Custom Toggle Switch */}
            <button
              onClick={() => toggle(s.key)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                s.enabled ? 'bg-accent' : 'bg-bg-elevated'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  s.enabled ? 'translate-x-6' : 'translate-x-1'
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
