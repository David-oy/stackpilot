import { NextRequest, NextResponse } from 'next/server';
import { providerService } from '@/lib/services/provider-service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    const q = searchParams.get('q')?.trim().slice(0, 120);

    let providers;
    if (category) {
      providers = await providerService.getProvidersByCategory(category);
    } else if (q) {
      providers = await providerService.searchProviders(q);
    } else {
      providers = await providerService.getAllProviders();
    }

    return NextResponse.json({ providers });
  } catch (error) {
    console.error('[api/providers] Error:', error);
    return NextResponse.json(
      { error: 'Failed to load providers.' },
      { status: 500 },
    );
  }
}
