import { supabase } from './lib/supabase';

export interface AuthUser {
  id: string;
  username: string;
  email: string;
}

function toAuthUser(user: { id: string; email?: string; user_metadata?: Record<string, unknown> }): AuthUser {
  const email = user.email ?? '';
  const meta = user.user_metadata ?? {};
  const displayName = meta['full_name'] ?? meta['display_name'] ?? meta['name'] ?? meta['username'];
  const username = typeof displayName === 'string' && displayName.trim()
    ? displayName.trim()
    : email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  return { id: user.id, username, email };
}

export async function login(email: string, password: string): Promise<AuthUser | null> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) return null;
  return toAuthUser(data.user);
}

export async function logout(): Promise<void> {
  await supabase.auth.signOut();
}

export async function getStoredUser(): Promise<AuthUser | null> {
  const { data } = await supabase.auth.getSession();
  const user = data.session?.user;
  if (!user) return null;
  return toAuthUser(user);
}
