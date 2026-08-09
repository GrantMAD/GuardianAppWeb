import { supabase } from '@/lib/supabase';
import type { Schedule } from '@/types';

export async function getSchedules(childId: string): Promise<Schedule[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('schedules')
    .select('*')
    .eq('child_id', childId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as Schedule[];
}

export async function createSchedule(
  payload: Omit<Schedule, 'id'>,
): Promise<Schedule> {
  if (!supabase) throw new Error('Supabase not configured');

  const { data, error } = await supabase
    .from('schedules')
    .insert(payload)
    .select()
    .single();

  if (error) throw error;
  return data as Schedule;
}

export async function deleteSchedule(scheduleId: string): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured');

  const { error } = await supabase
    .from('schedules')
    .delete()
    .eq('id', scheduleId);

  if (error) throw error;
}

export async function toggleSchedule(
  scheduleId: string,
  isActive: boolean,
): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured');

  const { error } = await supabase
    .from('schedules')
    .update({ is_active: isActive })
    .eq('id', scheduleId);

  if (error) throw error;
}
