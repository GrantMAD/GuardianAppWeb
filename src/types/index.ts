// ─── Family & Children ───────────────────────────────────────────────────────

export interface Family {
  id: string;
  parent_id: string;
  name: string;
  timezone: string;
  has_completed_onboarding: boolean;
  theme: 'light' | 'dark';
}

export interface Child {
  id: string;
  family_id: string;
  name: string;
  date_of_birth: string | null;
  avatar_url: string | null;
  device_id: string | null;
  device_name: string | null;
  os_type: 'android' | 'ios' | null;
  is_active: boolean;
  last_seen_at: string | null;
}

// ─── Rules ────────────────────────────────────────────────────────────────────

export type RuleType = 'TIME_LIMIT' | 'BLOCK' | 'ALLOW_ONLY';

export interface Rule {
  id: string;
  child_id: string;
  app_id: string | null;
  category: string | null;
  rule_type: RuleType;
  daily_limit_minutes: number | null;
  is_active: boolean;
  installed_apps: { app_name: string; icon_url: string | null; package_name: string } | null;
}

// ─── Schedules ────────────────────────────────────────────────────────────────

export interface Schedule {
  id: string;
  child_id: string;
  name: string;
  start_time: string; // "HH:MM"
  end_time: string;   // "HH:MM"
  days_of_week: number[]; // 0=Sun … 6=Sat
  scope: string;
  block_type: 'block' | 'allow_only';
  is_active: boolean;
}

// ─── Apps ────────────────────────────────────────────────────────────────────

export interface InstalledApp {
  id: string;
  child_id: string;
  package_name: string;
  app_name: string;
  category: string;
  icon_url: string | null;
  is_visible: boolean;
  is_system_app: boolean;
}

// ─── Usage ────────────────────────────────────────────────────────────────────

export interface UsageLog {
  id: string;
  child_id: string;
  app_id: string;
  date: string;
  usage_minutes: number;
  installed_apps: { app_name: string; category: string; icon_url: string | null; package_name: string } | null;
}

// ─── Permission Requests ──────────────────────────────────────────────────────

export interface PermissionRequest {
  id: string;
  child_id: string;
  app_id: string | null;
  request_type: 'extra_time' | 'unblock';
  extra_minutes: number | null;
  message: string | null;
  status: 'pending' | 'approved' | 'denied';
  approved_minutes: number | null;
  responded_at: string | null;
  created_at: string;
  children?: { name: string; avatar_url: string | null };
  installed_apps?: { app_name: string; icon_url: string | null };
}

// ─── Notifications ────────────────────────────────────────────────────────────

export interface NotificationLog {
  id: string;
  family_id: string;
  type: string;
  title: string;
  body: string;
  is_read: boolean;
  sent_at: string;
  target_role: string;
}

// ─── Rule Payloads ────────────────────────────────────────────────────────────

export interface CreateTimeLimitRulePayload {
  child_id: string;
  app_id?: string | null;
  category?: string | null;
  daily_limit_minutes: number;
}

export interface CreateBlockRulePayload {
  child_id: string;
  app_id?: string | null;
  category?: string | null;
}

// ─── Notification Preferences ─────────────────────────────────────────────────

export interface NotificationPreference {
  family_id: string;
  weekly_reports: boolean;
  permission_requests: boolean;
  app_installs: boolean;
  system_alerts: boolean;
}

// ─── Parent Activity Logs ─────────────────────────────────────────────────────

export interface AuditLogEntry {
  id: string;
  family_id: string;
  action_type: string;
  description: string;
  metadata?: any;
  created_at: string;
}
