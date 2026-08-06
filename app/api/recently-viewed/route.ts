import { NextRequest, NextResponse } from 'next/server';
import { getRouteSession } from '@/lib/supabase/route-user';
import { getProviderIdBySlug, getProviderSlugsByIds } from '@/lib/supabase/provider-refs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getRouteSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }
  const { supabase, user } = session;

  const { data, error } = await supabase
    .from('recently_viewed')
    .select('provider_id, viewed_at')
    .eq('user_id', user.id)
    .order('viewed_at', { ascending: false })
    .limit(10);
  if (error) {
    console.error('[api/recently-viewed] Error:', error);
    return NextResponse.json({ recent: [] });
  }

  const rows = (data ?? []) as Array<{ provider_id: string; viewed_at: string }>;
  const slugMap = await getProviderSlugsByIds(
    supabase,
    rows.map((r) => r.provider_id),
  );
  const recent = rows
    .map((r) => ({ providerSlug: slugMap.get(r.provider_id) ?? null, viewedAt: r.viewed_at }))
    .filter((r) => r.providerSlug);

  return NextResponse.json({ recent });
}

export async function POST(request: NextRequest) {
  const session = await getRouteSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }
  const { supabase, user } = session;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }
  const slug = typeof (body as { slug?: unknown })?.slug === 'string'
    ? ((body as { slug: string }).slug).trim()
    : '';
  if (!slug) {
    return NextResponse.json({ error: 'Provider slug is required.' }, { status: 400 });
  }

  const providerId = await getProviderIdBySlug(supabase, slug);
  if (!providerId) {
    return NextResponse.json({ error: 'Provider not found.' }, { status: 404 });
  }

  const { error } = await supabase.from('recently_viewed').upsert(
    { user_id: user.id, provider_id: providerId, viewed_at: new Date().toISOString() },
    { onConflict: 'user_id,provider_id' },
  );
  if (error) {
    console.error('[api/recently-viewed] Error:', error);
    return NextResponse.json({ error: 'Failed to record view.' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
