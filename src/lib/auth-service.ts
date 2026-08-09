import { supabase } from '@/lib/supabase';

function setAuthFlag() {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem('guardian-web-auth', 'true');
  }
}

function clearAuthFlag() {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem('guardian-web-auth');
  }
}

export async function signIn(email: string, password: string) {
  if (!supabase) {
    throw new Error('Supabase is not configured');
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  setAuthFlag();
  return data;
}

export async function signUp(email: string, password: string, familyName?: string) {
  if (!supabase) {
    throw new Error('Supabase is not configured');
  }

  const options = familyName ? { data: { family_name: familyName } } : undefined;
  const { data, error } = await supabase.auth.signUp({ email, password, options });
  if (error) throw error;
  if (data.session) {
    setAuthFlag();
  }
  return data;
}

export async function signOut() {
  if (!supabase) {
    throw new Error('Supabase is not configured');
  }

  const { error } = await supabase.auth.signOut();
  if (error) throw error;
  clearAuthFlag();
}

export async function getCurrentSession() {
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function getCurrentUser() {
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user;
}
