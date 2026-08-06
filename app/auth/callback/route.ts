import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get('code');
  const next = searchParams.get('next');

  const safeNext =
    next && next.startsWith('/') && !next.startsWith('//') ? next : '/workspace';

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${safeNext}`);
    }
  }

  const url = request.nextUrl.clone();
  url.pathname = '/login';
  url.searchParams.delete('code');
  url.searchParams.delete('next');
  url.searchParams.set('error', 'auth');
  return NextResponse.redirect(url);
}
