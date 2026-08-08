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

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      categoryId?: string;
      name?: string;
      description?: string;
      website?: string;
      documentation?: string;
      tags?: string[];
      reason?: string;
      aiSuggested?: boolean;
    };
    const categoryId = (body?.categoryId ?? '').trim().slice(0, 60);
    const name = (body?.name ?? '').trim().slice(0, 120);

    if (!categoryId) {
      return NextResponse.json({ error: 'A category is required.' }, { status: 400 });
    }
    if (!name) {
      return NextResponse.json({ error: 'A provider name is required.' }, { status: 400 });
    }
    if (body?.website) {
      try {
        new URL(body.website);
      } catch {
        return NextResponse.json(
          { error: `"${body.website}" is not a valid URL.` },
          { status: 400 },
        );
      }
    }

    const result = await providerService.upsertProvider(categoryId, {
      name,
      description: (body?.description ?? '').trim().slice(0, 240),
      website: (body?.website ?? '').trim(),
      documentation: (body?.documentation ?? '').trim(),
      tags: Array.isArray(body?.tags) ? body.tags.map((t) => String(t).trim()).filter(Boolean).slice(0, 8) : [],
      reason: (body?.reason ?? '').trim().slice(0, 240),
      aiSuggested: Boolean(body?.aiSuggested),
    });

    if (result.duplicate) {
      return NextResponse.json({ ...result, duplicate: true });
    }
    if (result.created && !result.provider) {
      return NextResponse.json(
        { error: 'Provider was saved but could not be reloaded.' },
        { status: 500 },
      );
    }
    return NextResponse.json(result);
  } catch (error) {
    console.error('[api/providers] POST Error:', error);
    return NextResponse.json(
      { error: 'Could not save the provider. Please try again.' },
      { status: 500 },
    );
  }
}
