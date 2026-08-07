import { NextRequest, NextResponse } from 'next/server';
import { providerService } from '@/lib/services/provider-service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const q = request.nextUrl.searchParams.get('q')?.trim().slice(0, 120);
    if (!q) {
      return NextResponse.json({ error: 'Query parameter "q" is required.' }, { status: 400 });
    }

    const providers = await providerService.searchProviders(q);
    return NextResponse.json({ providers });
  } catch (error) {
    console.error('[api/search] Error:', error);
    return NextResponse.json(
      { error: 'Failed to search providers.' },
      { status: 500 },
    );
  }
}
