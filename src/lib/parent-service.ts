import { supabase } from '@/lib/supabase';
import type { 
  CreateTimeLimitRulePayload, 
  CreateBlockRulePayload, 
  Rule, 
  NotificationPreference, 
  AuditLogEntry 
} from '@/types';

// ─── Rules ────────────────────────────────────────────────────────────────────

export async function createTimeLimitRule(payload: CreateTimeLimitRulePayload): Promise<Rule> {
  if (!supabase) throw new Error('Supabase not configured');

  const { data, error } = await supabase
    .from('rules')
    .insert({
      child_id: payload.child_id,
      app_id: payload.app_id,
      category: payload.category,
      rule_type: 'TIME_LIMIT',
      daily_limit_minutes: payload.daily_limit_minutes,
      weekly_limit_minutes: payload.weekly_limit_minutes ?? null,
      location_profile_id: payload.location_profile_id ?? null,
      is_active: true,
    })
    .select()
    .single();

  if (error) throw error;
  return data as Rule;
}


export async function createBlockRule(payload: CreateBlockRulePayload): Promise<Rule> {
  if (!supabase) throw new Error('Supabase not configured');

  const { data, error } = await supabase
    .from('rules')
    .insert({
      child_id: payload.child_id,
      app_id: payload.app_id,
      category: payload.category,
      rule_type: 'BLOCK',
      location_profile_id: payload.location_profile_id ?? null,
      is_active: true,
    })
    .select()
    .single();

  if (error) throw error;
  return data as Rule;
}

export async function removeRule(ruleId: string): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured');

  const { error } = await supabase
    .from('rules')
    .delete()
    .eq('id', ruleId);

  if (error) throw error;
}

// ─── Notification Preferences ─────────────────────────────────────────────────

export async function getNotificationPreferences(familyId: string): Promise<NotificationPreference | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('family_id', familyId)
    .maybeSingle();

  if (error) throw error;
  return data as NotificationPreference | null;
}

export async function updateNotificationPreferences(
  familyId: string, 
  preferences: Partial<NotificationPreference>
): Promise<NotificationPreference> {
  if (!supabase) throw new Error('Supabase not configured');

  const { data, error } = await supabase
    .from('notification_preferences')
    .upsert({ family_id: familyId, ...preferences }, { onConflict: 'family_id' })
    .select()
    .single();

  if (error) throw error;
  return data as NotificationPreference;
}

// ─── Parent Activity Logs ─────────────────────────────────────────────────────

export async function logParentAction(
  familyId: string, 
  actionType: string, 
  description: string, 
  metadata?: any
): Promise<void> {
  if (!supabase) return;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from('parent_audit_log')
    .insert({
      family_id: familyId,
      parent_id: user.id,
      action: actionType,
      details: { description, ...metadata }
    });

  if (error) console.error('Failed to write audit log:', error);
}

export async function getParentActivityLogs(familyId: string): Promise<AuditLogEntry[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('parent_audit_log')
    .select('*')
    .eq('family_id', familyId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw error;
  
  // Map backend format to frontend format
  return data.map((row: any) => ({
    id: row.id,
    family_id: row.family_id,
    action_type: row.action,
    description: row.details?.description || 'Action performed',
    metadata: row.details,
    created_at: row.created_at
  }));
}
