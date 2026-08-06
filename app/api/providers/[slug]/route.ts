import { NextRequest, NextResponse } from 'next/server';
import { providerService } from '@/lib/services/provider-service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteContext = {
  params: { slug: string };
};

export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const slug = params.slug?.trim().toLowerCase();
    if (!slug) {
      return NextResponse.json({ error: 'Provider slug is required.' }, { status: 400 });
    }

    const provider = await providerService.getProviderBySlug(slug);
    if (!provider) {
      return NextResponse.json({ error: 'Provider not found.' }, { status: 404 });
    }

    const alternatives = await providerService.getAlternatives(slug);

    return NextResponse.json({ provider, alternatives });
  } catch (error) {
    console.error('[api/providers/[slug]] Error:', error);
    return NextResponse.json(
      { error: 'Failed to load provider.' },
      { status: 500 },
    );
  }
}
