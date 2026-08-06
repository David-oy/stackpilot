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

const HANDLER_TIMEOUT_MS = Number(process.env.ANALYZE_TIMEOUT_MS ?? 58_000);

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

async function handleAnalyze(request: NextRequest) {
  const started = Date.now();
  const trace = (step: string, detail = '') =>
    console.log(`[api/analyze] ${step}${detail ? ` ${detail}` : ''} (+${Date.now() - started}ms)`);

  trace('start');

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    trace('invalid json body');
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }
  trace('body parsed');

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? 'Invalid request body.';
    trace(`validation failed: ${message}`);
    return NextResponse.json({ error: message }, { status: 400 });
  }
  trace('validation ok');

  const cacheKey = normalizeCacheKey(parsed.data.description);

  const cacheReadStart = Date.now();
  const cached = await providerService.getAnalysis(cacheKey);
  trace(
    `cache read (${Date.now() - cacheReadStart}ms) — ${cached ? 'HIT' : 'MISS'}`,
  );
  if (cached) {
    trace('cache response serialized');
    return NextResponse.json(cached as StackAnalysis);
  }

  const categoriesStart = Date.now();
  const allCategories = await providerService.getAllCategories();
  trace(
    `provider db: getAllCategories (${Date.now() - categoriesStart}ms, ${allCategories.length} categories)`,
  );

  const slugIndex = buildSlugIndex(allCategories);

  const geminiStart = Date.now();
  const gemini = await analyzeWithGemini(
    parsed.data.description,
    Array.from(slugIndex.keys()),
  );
  trace(`gemini analysis (${Date.now() - geminiStart}ms)`);

  const categories: StackAnalysis['categories'] = [];
  const fallbackNeeded: Array<{ id: string; name: string; description: string }> = [];

  for (const cat of gemini.categories) {
    const canonicalSlug = slugIndex.get(cat.id) ?? cat.id;
    let providers: AnalysisProvider[] = [];
    let usedDatabase = false;

    if (slugIndex.has(cat.id)) {
      const lookupStart = Date.now();
      providers = await providerService.getCategoryProvidersAsAnalysis(canonicalSlug, 6);
      trace(
        `provider lookup ${canonicalSlug} (${Date.now() - lookupStart}ms, ${providers.length} providers)`,
      );
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
  trace(`category generation (${categories.length} categories)`);

  if (fallbackNeeded.length > 0) {
    const fallbackStart = Date.now();
    const fallback = await fetchFallbackProviders(
      parsed.data.description,
      fallbackNeeded,
    );
    trace(
      `gemini fallback providers (${Date.now() - fallbackStart}ms, ${fallbackNeeded.length} categories)`,
    );
    for (const category of categories) {
      const fallbackProviders = fallback[category.id];
      if (fallbackProviders && fallbackProviders.length > 0) {
        category.providers = fallbackProviders;
        void providerService.storeFallbackCategoryAndProviders(
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

  const cacheWriteStart = Date.now();
  await providerService.setAnalysis(cacheKey, analysis, parsed.data.description);
  trace(`cache write (${Date.now() - cacheWriteStart}ms)`);

  trace('response serialized');
  return NextResponse.json(analysis);
}

export async function POST(request: NextRequest) {
  let timer: NodeJS.Timeout | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new AnalysisError('Analysis timed out. Please try again.', 504)),
      HANDLER_TIMEOUT_MS,
    );
  });

  try {
    return await Promise.race([handleAnalyze(request), timeoutPromise]);
  } catch (error) {
    if (error instanceof AnalysisError) {
      console.error(`[api/analyze] AnalysisError (${error.status}):`, error.message);
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error('[api/analyze] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Something went wrong while analyzing your project. Please try again.' },
      { status: 500 },
    );
  } finally {
    if (timer) clearTimeout(timer);
  }
}
