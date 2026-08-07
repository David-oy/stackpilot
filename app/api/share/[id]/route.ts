import { NextRequest, NextResponse } from 'next/server';
import { getShareRepository } from '@/lib/stacks/share';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteContext = {
  params: { id: string };
};

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const id = params.id?.trim();
  if (!id) {
    return NextResponse.json({ error: 'Share id is required.' }, { status: 400 });
  }

  const payload = await getShareRepository().get(id);
  if (!payload) {
    return NextResponse.json({ error: 'Share not found.' }, { status: 404 });
  }

  return NextResponse.json({ share: payload });
}
