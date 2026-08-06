import type { SupabaseClient, User } from '@supabase/supabase-js';
import { createClient, isSupabaseConfigured } from './server';

export type RouteSession = { supabase: SupabaseClient; user: User } | null;

export async function getRouteSession(): Promise<RouteSession> {
  if (!isSupabaseConfigured) return null;
  try {
    const supabase = createClient();
    const { data, error } = await supabase.auth.getUser();
    if (error) return null;
    if (!data.user) return null;
    return { supabase, user: data.user };
  } catch {
    return null;
  }
}
