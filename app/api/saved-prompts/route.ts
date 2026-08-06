import { NextRequest, NextResponse } from 'next/server';
import { getRouteSession } from '@/lib/supabase/route-user';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getRouteSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }
  const { supabase, user } = session;

  const { data, error } = await supabase
    .from('saved_prompts')
    .select('id, prompt, created_at, updated_at')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(50);
  if (error) {
    console.error('[api/saved-prompts] Error:', error);
    return NextResponse.json({ prompts: [] });
  }

  const prompts = (data ?? []).map((row) => ({
    id: (row as { id: string }).id,
    prompt: (row as { prompt: string }).prompt,
    createdAt: (row as { created_at: string }).created_at,
    updatedAt: (row as { updated_at: string }).updated_at,
  }));

  return NextResponse.json({ prompts });
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
  const payload = body as { prompt?: string; analysis?: unknown };
  const prompt = typeof payload.prompt === 'string' ? payload.prompt.trim() : '';
  if (!prompt) {
    return NextResponse.json({ error: 'Prompt is required.' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('saved_prompts')
    .insert({
      user_id: user.id,
      prompt,
      analysis_snapshot: payload.analysis ?? null,
    })
    .select('id, prompt, created_at, updated_at')
    .single();
  if (error) {
    console.error('[api/saved-prompts] Error:', error);
    return NextResponse.json({ error: 'Failed to save prompt.' }, { status: 500 });
  }

  return NextResponse.json({
    prompt: {
      id: (data as { id: string }).id,
      prompt: (data as { prompt: string }).prompt,
      createdAt: (data as { created_at: string }).created_at,
      updatedAt: (data as { updated_at: string }).updated_at,
    },
  });
}

export async function DELETE(request: NextRequest) {
  const session = await getRouteSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }
  const { supabase, user } = session;

  const id = request.nextUrl.searchParams.get('id')?.trim() ?? '';
  if (!id) {
    return NextResponse.json({ error: 'Prompt id is required.' }, { status: 400 });
  }

  const { error } = await supabase
    .from('saved_prompts')
    .delete()
    .eq('user_id', user.id)
    .eq('id', id);
  if (error) {
    console.error('[api/saved-prompts] Error:', error);
    return NextResponse.json({ error: 'Failed to delete prompt.' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
