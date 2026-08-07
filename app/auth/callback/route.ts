import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Mirrors AUTH_NEXT_COOKIE in lib/auth/pending-query.ts. Kept literal here to
// avoid importing a 'use client' module from a server route.
const AUTH_NEXT_COOKIE = 'stack2set:auth-next';

function safePath(path: string | null | undefined): string | null {
  return path && path.startsWith('/') && !path.startsWith('//') ? path : null;
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get('code');
  const next = searchParams.get('next');

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const destination = safePath(request.cookies.get(AUTH_NEXT_COOKIE)?.value) ?? safePath(next) ?? '/workspace';
      const response = NextResponse.redirect(`${origin}${destination}`);
      response.cookies.delete(AUTH_NEXT_COOKIE);
      return response;
    }
  }

  const url = request.nextUrl.clone();
  url.pathname = '/login';
  url.searchParams.delete('code');
  url.searchParams.delete('next');
  url.searchParams.set('error', 'auth');
  const response = NextResponse.redirect(url);
  response.cookies.delete(AUTH_NEXT_COOKIE);
  return response;
}
