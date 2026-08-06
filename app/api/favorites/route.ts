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
    .from('favorites')
    .select('provider_id, category_id, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  if (error) {
    console.error('[api/favorites] Error:', error);
    return NextResponse.json({ favorites: [] });
  }

  const rows = (data ?? []) as Array<{
    provider_id: string;
    category_id: string | null;
    created_at: string;
  }>;
  const slugMap = await getProviderSlugsByIds(
    supabase,
    rows.map((r) => r.provider_id),
  );
  const favorites = rows
    .map((r) => ({
      providerSlug: slugMap.get(r.provider_id) ?? null,
      categoryId: r.category_id,
      createdAt: r.created_at,
    }))
    .filter((f) => f.providerSlug);

  return NextResponse.json({ favorites });
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
  const payload = body as { slug?: string; categoryId?: string };
  const slug = typeof payload.slug === 'string' ? payload.slug.trim() : '';
  if (!slug) {
    return NextResponse.json({ error: 'Provider slug is required.' }, { status: 400 });
  }

  const providerId = await getProviderIdBySlug(supabase, slug);
  if (!providerId) {
    return NextResponse.json({ error: 'Provider not found.' }, { status: 404 });
  }

  const categoryId = typeof payload.categoryId === 'string' ? payload.categoryId : null;
  const { error } = await supabase.from('favorites').upsert(
    { user_id: user.id, provider_id: providerId, category_id: categoryId },
    { onConflict: 'user_id,provider_id' },
  );
  if (error) {
    console.error('[api/favorites] Error:', error);
    return NextResponse.json({ error: 'Failed to save favorite.' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const session = await getRouteSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }
  const { supabase, user } = session;

  const slug = request.nextUrl.searchParams.get('slug')?.trim() ?? '';
  if (!slug) {
    return NextResponse.json({ error: 'Provider slug is required.' }, { status: 400 });
  }

  const providerId = await getProviderIdBySlug(supabase, slug);
  if (!providerId) {
    return NextResponse.json({ success: true });
  }

  const { error } = await supabase
    .from('favorites')
    .delete()
    .eq('user_id', user.id)
    .eq('provider_id', providerId);
  if (error) {
    console.error('[api/favorites] Error:', error);
    return NextResponse.json({ error: 'Failed to remove favorite.' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
