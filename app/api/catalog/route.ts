import { NextRequest, NextResponse } from 'next/server';
import { providerService } from '@/lib/services/provider-service';
import type { CategoryRecord, ProviderWithRelations } from '@/lib/db/schema';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Deterministic fingerprint of the exact snapshot this route returns. The client
// sends it back as If-None-Match, so unchanged catalogs answer 304 with no
// payload instead of re-downloading all ~1,000+ providers on every navigation.
function fingerprint(categories: CategoryRecord[], providers: ProviderWithRelations[]): string {
  let h1 = 0;
  let h2 = 0;
  const mix = (s: string) => {
    for (let i = 0; i < s.length; i += 1) {
      const c = s.charCodeAt(i);
      h1 = (h1 + c) | 0;
      h2 = ((h2 * 33) ^ c) >>> 0;
    }
  };
  mix(`c:${categories.length}`);
  for (const c of categories) mix(`|${c.slug}@${c.updatedAt ?? ''}`);
  mix(`p:${providers.length}`);
  for (const p of providers) {
    mix(
      `|${p.slug}@${p.updatedAt ?? ''}:${p.features?.length ?? 0}:${p.tags?.length ?? 0}:${p.alternatives?.length ?? 0}`,
    );
  }
  return `${h1.toString(36)}-${h2.toString(36)}`;
}

export async function GET(request: NextRequest) {
  try {
    const [categories, providers] = await Promise.all([
      providerService.getAllCategories(),
      providerService.getAllProviders(),
    ]);
    const revision = fingerprint(categories, providers);
    const etag = `"${revision}"`;
    const ifNoneMatch = request.headers.get('if-none-match');
    if (ifNoneMatch && ifNoneMatch.replace(/^W\//, '') === etag) {
      return new Response(null, {
        status: 304,
        headers: { ETag: etag, 'Cache-Control': 'no-store' },
      });
    }
    return NextResponse.json(
      { revision, categories, providers },
      { headers: { ETag: etag, 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    console.error('[api/catalog] Error:', error);
    return NextResponse.json({ error: 'Failed to load catalog.' }, { status: 500 });
  }
}
