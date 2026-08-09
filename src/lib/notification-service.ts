import { supabase } from '@/lib/supabase';
import type { PermissionRequest, NotificationLog } from '@/types';

// ─── Permission Requests ──────────────────────────────────────────────────────

export async function getPendingRequests(
  familyId: string,
): Promise<PermissionRequest[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('permission_requests')
    .select(`
      *,
      children!inner(name, avatar_url, family_id),
      installed_apps(app_name, icon_url)
    `)
    .eq('children.family_id', familyId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching pending requests:', error);
    return [];
  }
  return (data ?? []) as unknown as PermissionRequest[];
}

export async function updateRequestStatus(
  requestId: string,
  status: 'approved' | 'denied',
  approvedMinutes: number | null = null,
): Promise<boolean> {
  if (!supabase) return false;

  const { error } = await supabase
    .from('permission_requests')
    .update({
      status,
      approved_minutes: approvedMinutes,
      responded_at: new Date().toISOString(),
    })
    .eq('id', requestId);

  if (error) {
    console.error('Error updating request:', error);
    return false;
  }
  return true;
}

// ─── Notifications ────────────────────────────────────────────────────────────

export async function getNotifications(
  familyId: string,
  limit = 50,
): Promise<NotificationLog[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('notifications_log')
    .select('*')
    .eq('family_id', familyId)
    .eq('target_role', 'parent')
    .order('sent_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as NotificationLog[];
}

export async function markNotificationsRead(ids: string[]): Promise<void> {
  if (!supabase || ids.length === 0) return;

  await supabase
    .from('notifications_log')
    .update({ is_read: true })
    .in('id', ids);
}
