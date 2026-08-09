import { supabase } from '@/lib/supabase';
import type { Rule, RuleType } from '@/types';

export async function getRules(childId: string): Promise<Rule[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('rules')
    .select('*, installed_apps(app_name, icon_url, package_name)')
    .eq('child_id', childId)
    .eq('is_active', true);

  if (error) throw error;
  return (data ?? []) as Rule[];
}

export async function createRule(
  childId: string,
  ruleType: RuleType,
  appId?: string,
  category?: string,
  dailyLimitMinutes?: number,
): Promise<Rule> {
  if (!supabase) throw new Error('Supabase not configured');

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('rules')
    .insert({
      child_id: childId,
      rule_type: ruleType,
      app_id: appId ?? null,
      category: category ?? null,
      daily_limit_minutes: dailyLimitMinutes ?? null,
      created_by: user.id,
    })
    .select('*, installed_apps(app_name, icon_url, package_name)')
    .single();

  if (error) throw error;
  return data as Rule;
}

export async function deleteRule(ruleId: string): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured');

  const { error } = await supabase.from('rules').delete().eq('id', ruleId);
  if (error) throw error;
}

export async function toggleRule(ruleId: string, isActive: boolean): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured');

  const { error } = await supabase
    .from('rules')
    .update({ is_active: isActive })
    .eq('id', ruleId);

  if (error) throw error;
}
