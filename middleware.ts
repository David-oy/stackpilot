import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    '/account/:path*',
    '/login',
    '/signup',
    '/forgot-password',
    '/auth/:path*',
    '/((?!_next/static|_next/image|favicon.ico|icon.svg|manifest.webmanifest|og.svg|robots.txt|sitemap.xml).*)',
  ],
};
