import { supabase } from '@/lib/supabase';
import { logParentAction } from '@/lib/parent-service';

export interface LocationProfile {
  id: string;
  child_id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
  is_active: boolean;
  created_at: string;
}

export async function getLocationProfiles(childId: string): Promise<LocationProfile[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('location_profiles')
    .select('*')
    .eq('child_id', childId)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as LocationProfile[];
}

export async function createLocationProfile(
  childId: string,
  name: string,
  latitude: number,
  longitude: number,
  radiusMeters: number,
  familyId: string
): Promise<LocationProfile> {
  if (!supabase) throw new Error('Supabase not configured');
  const { data, error } = await supabase
    .from('location_profiles')
    .insert({ child_id: childId, name, latitude, longitude, radius_meters: radiusMeters })
    .select()
    .single();

  if (error) throw error;

  try {
    await logParentAction(familyId, 'LOCATION_PROFILE_CREATED', `Created location profile: "${name}"`, childId);
  } catch (e) {
    console.warn('Failed to log LOCATION_PROFILE_CREATED', e);
  }

  return data as LocationProfile;
}

export async function updateLocationProfile(
  id: string,
  fields: Partial<Pick<LocationProfile, 'name' | 'latitude' | 'longitude' | 'radius_meters'>>
): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured');
  const { error } = await supabase.from('location_profiles').update(fields).eq('id', id);
  if (error) throw error;
}

export async function deleteLocationProfile(id: string, familyId: string, childId: string, profileName: string): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured');
  const { error } = await supabase.from('location_profiles').delete().eq('id', id);
  if (error) throw error;

  try {
    await logParentAction(familyId, 'LOCATION_PROFILE_DELETED', `Deleted location profile: "${profileName}"`, childId);
  } catch (e) {
    console.warn('Failed to log LOCATION_PROFILE_DELETED', e);
  }
}

/** Haversine distance in metres between two lat/lng points */
export function haversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
