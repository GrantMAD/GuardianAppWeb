import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { activityLog, childProfiles, pairingCode, rules, topApps, usageSummary, weeklyUsage } from '@/lib/mockData';

export async function updateRuleStatus(ruleId: string, enabled: boolean) {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured');
  }

  const { error } = await supabase.from('rules').update({ is_active: enabled }).eq('id', ruleId);
  if (error) throw error;
  return true;
}

export async function updatePermissionRequestStatus(requestId: string, status: 'approved' | 'denied') {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured');
  }

  const { error } = await supabase.from('permission_requests').update({ status }).eq('id', requestId);
  if (error) throw error;
  return true;
}

export async function createScheduleEntry(payload: {
  childId: string;
  name: string;
  startTime: string;
  endTime: string;
  daysOfWeek: number[];
  scope: string;
  blockType: 'block' | 'allow_only';
  isActive: boolean;
}) {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured');
  }

  const { error } = await supabase.from('schedules').insert({
    child_id: payload.childId,
    name: payload.name,
    start_time: payload.startTime,
    end_time: payload.endTime,
    days_of_week: payload.daysOfWeek,
    scope: payload.scope,
    block_type: payload.blockType,
    is_active: payload.isActive,
  });

  if (error) throw error;
  return true;
}

export async function getDashboardData() {
  if (!isSupabaseConfigured) {
    return {
      children: childProfiles,
      usageSummary,
      topApps,
      rules,
      weeklyUsage,
      activityLog,
      pairingCode,
      requests: [],
    };
  }

  try {
    if (!supabase) {
      throw new Error('Supabase client is not configured');
    }

    const [{ data: childrenData }, { data: rulesData }, { data: usageData }, { data: requestsData }] = await Promise.all([
      supabase.from('children').select('id, name, device_name, os_type').limit(5),
      supabase.from('rules').select('id, rule_type, is_active, child_id').limit(10),
      supabase.from('app_usage_logs').select('usage_minutes, child_id').limit(10),
      supabase.from('permission_requests').select('id, message, status, created_at, children(name)').eq('status', 'pending').order('created_at', { ascending: false }).limit(10),
    ]);

    const children = (childrenData || []).map((child: any) => ({
      id: child.id,
      name: child.name,
      age: 'Child',
      device: child.device_name || child.os_type || 'Device',
    }));

    const derivedRules = (rulesData || []).map((rule: any) => ({
      id: rule.id,
      name: rule.rule_type === 'BLOCK' ? 'Blocked app' : 'Schedule rule',
      type: rule.rule_type === 'BLOCK' ? 'Block' : 'Schedule',
      enabled: rule.is_active ?? true,
    }));

    const totalMinutes = (usageData || []).reduce((sum: number, entry: any) => sum + (entry.usage_minutes || 0), 0);
    const requests = (requestsData || []).map((request: any) => ({
      id: request.id,
      child: request.children?.name || 'Child',
      message: request.message || 'Requested access',
      status: request.status || 'Pending',
    }));

    return {
      children: children.length > 0 ? children : childProfiles,
      usageSummary: [
        { label: 'Screen time', value: `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`, detail: 'Today' },
        { label: 'Apps used', value: `${Math.max(1, children.length)}`, detail: 'Active now' },
        { label: 'Pending requests', value: `${requests.length}`, detail: 'Needs review' },
      ],
      topApps: topApps,
      rules: derivedRules.length > 0 ? derivedRules : rules,
      weeklyUsage,
      activityLog,
      pairingCode,
      requests,
    };
  } catch {
    return {
      children: childProfiles,
      usageSummary,
      topApps,
      rules,
      weeklyUsage,
      activityLog,
      pairingCode,
      requests: [],
    };
  }
}
