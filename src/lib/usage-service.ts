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

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const date = d.toISOString().slice(0, 10);
    const label = i === 0 ? 'Today' : d.toLocaleDateString('en', { weekday: 'short' });

    const [usage, summary] = await Promise.all([
      getDailyUsage(childId, date),
      getDailyScreenTimeSummary(childId, date),
    ]);

    results.push({ date, label, total: summary?.total_minutes ?? 0, logs: usage });
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
