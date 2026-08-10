import { supabase } from '@/lib/supabase';
import type { Family, Child } from '@/types';

export async function getFamily(): Promise<Family | null> {
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('families')
    .select('*')
    .eq('parent_id', user.id)
    .maybeSingle();

  if (error) throw error;
  return data as Family | null;
}

export async function createFamily(name: string): Promise<Family> {
  if (!supabase) throw new Error('Supabase not configured');
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('families')
    .insert({ parent_id: user.id, name })
    .select()
    .single();

  if (error) throw error;
  return data as Family;
}

export async function getChildren(familyId: string): Promise<Child[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('children')
    .select('*')
    .eq('family_id', familyId)
    .order('name');

  if (error) throw error;
  return data as Child[];
}

export async function addChild(familyId: string, name: string): Promise<Child> {
  if (!supabase) throw new Error('Supabase not configured');

  const { data, error } = await supabase
    .from('children')
    .insert({ family_id: familyId, name })
    .select()
    .single();

  if (error) throw error;
  return data as Child;
}

export async function updateChild(
  childId: string,
  updates: Partial<Pick<Child, 'name' | 'is_active'>>,
): Promise<Child> {
  if (!supabase) throw new Error('Supabase not configured');

  const { data, error } = await supabase
    .from('children')
    .update(updates)
    .eq('id', childId)
    .select()
    .single();

  if (error) throw error;
  return data as Child;
}

export async function uploadChildAvatar(
  childId: string,
  file: File,
): Promise<Child> {
  if (!supabase) throw new Error('Supabase not configured');

  const ext = file.name.split('.').pop() || 'jpg';
  const fileName = `${childId}-${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(fileName, file, { cacheControl: '3600', upsert: false });

  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabase.storage
    .from('avatars')
    .getPublicUrl(fileName);

  const { data, error: updateError } = await supabase
    .from('children')
    .update({ avatar_url: publicUrl })
    .eq('id', childId)
    .select()
    .single();

  if (updateError) throw updateError;
  return data as Child;
}

export async function generatePairingCode(
  familyId: string,
  childId: string,
): Promise<string> {
  if (!supabase) throw new Error('Supabase not configured');

  const { data, error } = await supabase.rpc('generate_pairing_code', {
    p_family_id: familyId,
    p_child_id: childId,
  });

  if (error) throw error;
  return data as string;
}

export async function updateFamilyTheme(familyId: string, theme: 'light' | 'dark'): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured');
  
  const { error } = await supabase
    .from('families')
    .update({ theme })
    .eq('id', familyId);
    
  if (error) throw error;
}
