import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { providerService } from '@/lib/services/provider-service';
import { normalizeCacheKey } from '@/lib/db/cache';
import type { AnalysisProvider } from '@/lib/types';
import type { StackAnalysis } from '@/lib/types';
import {
  analyzeWithGemini,
  fetchFallbackProviders,
  AnalysisError,
} from '@/lib/gemini';

export const runtime = 'nodejs';
export const maxDuration = 60;

const requestSchema = z.object({
  description: z
    .string()
    .trim()
    .min(1, 'Please describe your project.')
    .max(2000, 'Project description is too long.')
    .default(''),
});

function buildSlugIndex(categories: Array<{ slug: string; aliases?: string[] }>) {
  const index = new Map<string, string>();
  for (const category of categories) {
    index.set(category.slug, category.slug);
    index.set(category.slug.replace(/-/g, ''), category.slug);
    for (const alias of category.aliases ?? []) {
      index.set(alias, category.slug);
    }
  }
  return index;
}

export async function POST(request: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
    }

    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? 'Invalid request body.';
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const cacheKey = normalizeCacheKey(parsed.data.description);
    const cached = await providerService.getAnalysis(cacheKey);
    if (cached) {
      return NextResponse.json(cached as StackAnalysis);
    }

    const allCategories = await providerService.getAllCategories();
    const slugIndex = buildSlugIndex(allCategories);

    const gemini = await analyzeWithGemini(parsed.data.description, Array.from(slugIndex.keys()));

    const categories: StackAnalysis['categories'] = [];
    const fallbackNeeded: Array<{ id: string; name: string; description: string }> = [];

    for (const cat of gemini.categories) {
      const canonicalSlug = slugIndex.get(cat.id) ?? cat.id;
      let providers: AnalysisProvider[] = [];
      let usedDatabase = false;

      if (slugIndex.has(cat.id)) {
        providers = await providerService.getCategoryProvidersAsAnalysis(canonicalSlug, 6);
        usedDatabase = providers.length > 0;
      }

      if (providers.length === 0 && cat.providers.length > 0) {
        providers = cat.providers;
      }

      if (providers.length === 0) {
        fallbackNeeded.push({ id: canonicalSlug, name: cat.name, description: cat.description });
      }

      categories.push({
        id: canonicalSlug,
        name: cat.name,
        description: cat.description,
        providers,
      });

      if (!usedDatabase && cat.providers.length > 0) {
        void providerService.storeFallbackCategoryAndProviders(
          { id: canonicalSlug, name: cat.name, description: cat.description },
          cat.providers,
        );
      }
    }

    if (fallbackNeeded.length > 0) {
      const fallback = await fetchFallbackProviders(
        parsed.data.description,
        fallbackNeeded,
      );
      for (const category of categories) {
        const fallbackProviders = fallback[category.id];
        if (fallbackProviders && fallbackProviders.length > 0) {
          category.providers = fallbackProviders;
          await providerService.storeFallbackCategoryAndProviders(
            { id: category.id, name: category.name, description: category.description },
            fallbackProviders,
          );
        }
      }
    }

    const analysis: StackAnalysis = {
      projectType: gemini.projectType,
      summary: gemini.summary,
      complexity: gemini.complexity,
      categories,
      integrations: gemini.integrations,
    };

    await providerService.setAnalysis(cacheKey, analysis, parsed.data.description);

    return NextResponse.json(analysis);
  } catch (error) {
    if (error instanceof AnalysisError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error('[api/analyze] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Something went wrong while analyzing your project. Please try again.' },
      { status: 500 },
    );
  }
}
