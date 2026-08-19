import { supabase } from '@/lib/supabase';
import type { UsageLog } from '@/types';

export async function getDailyUsage(
  childId: string,
  date: string,
): Promise<UsageLog[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('app_usage_logs')
    .select('*, installed_apps(app_name, category, icon_url, package_name)')
    .eq('child_id', childId)
    .eq('date', date)
    .order('usage_minutes', { ascending: false });

  if (error) throw error;
  return (data ?? []) as UsageLog[];
}

export async function getDailyScreenTimeSummary(
  childId: string,
  date: string,
): Promise<{ total_minutes: number; apps_used: number } | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('v_daily_screen_time')
    .select('total_minutes, apps_used')
    .eq('child_id', childId)
    .eq('date', date)
    .maybeSingle();

  if (error) throw error;
  return data as { total_minutes: number; apps_used: number } | null;
}

/** Fetches usage across the last `days` days and returns per-day totals */
export async function getWeeklyUsage(
  childId: string,
  days = 7,
): Promise<{ date: string; label: string; total: number; logs: UsageLog[] }[]> {
  if (!supabase) return [];

  const results: { date: string; label: string; total: number; logs: UsageLog[] }[] = [];

  const endD = new Date();
  const startD = new Date();
  startD.setDate(endD.getDate() - (days - 1));
  const startDate = startD.toISOString().slice(0, 10);
  const endDate = endD.toISOString().slice(0, 10);

  const { data: summaries, error } = await supabase
    .from('v_daily_screen_time')
    .select('date, total_minutes')
    .eq('child_id', childId)
    .gte('date', startDate)
    .lte('date', endDate);
    
  if (error) throw error;

  const summaryMap = new Map(summaries?.map(s => [s.date, s.total_minutes]) || []);

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const date = d.toISOString().slice(0, 10);
    const label = i === 0 ? 'Today' : d.toLocaleDateString('en', { weekday: 'short' });

    results.push({ date, label, total: summaryMap.get(date) ?? 0, logs: [] });
  }

  return results;
}

export async function getInstalledApps(childId: string, visibleOnly = true) {
  if (!supabase) return [];

  let query = supabase
    .from('installed_apps')
    .select('*')
    .eq('child_id', childId)
    .order('app_name');

  if (visibleOnly) query = query.eq('is_visible', true);

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

/**
 * Returns a map of appId → total usage minutes over the rolling last 7 days.
 * Used by the rules page to display current weekly progress next to each rule.
 */
export async function getWeeklyUsageByApp(childId: string): Promise<Record<string, number>> {
  if (!supabase) return {};

  const endDate = new Date().toISOString().slice(0, 10);
  const startDate = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from('app_usage_logs')
    .select('app_id, usage_minutes')
    .eq('child_id', childId)
    .gte('date', startDate)
    .lte('date', endDate);

  if (error) throw error;

  const result: Record<string, number> = {};
  for (const row of data ?? []) {
    result[row.app_id] = (result[row.app_id] ?? 0) + row.usage_minutes;
  }
  return result;
}

