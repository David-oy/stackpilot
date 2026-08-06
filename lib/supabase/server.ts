import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

export const isSupabaseConfigured = Boolean(
  (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL) &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

function cookieOptions() {
  const cookieStore = cookies();
  return {
    getAll() {
      return cookieStore.getAll();
    },
    setAll(cookiesToSet: Array<{ name: string; value: string; options: Record<string, unknown> }>) {
      try {
        cookiesToSet.forEach(({ name, value, options: opts }) =>
          cookieStore.set(name, value, opts as Parameters<typeof cookieStore.set>[2]),
        );
      } catch {
        // Called from a Server Component. Session cookies are refreshed by middleware.
      }
    },
  };
}

export function createClient() {
  return createServerClient(supabaseUrl, supabaseAnonKey, { cookies: cookieOptions() });
}

export function createAdminClient() {
  return createServerClient(supabaseUrl, serviceRoleKey, { cookies: cookieOptions() });
}
