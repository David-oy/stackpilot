import { NextRequest, NextResponse } from 'next/server';
import { providerService } from '@/lib/services/provider-service';
import { normalizeCacheKey } from '@/lib/db/cache';
import { MAX_DESCRIPTION_LENGTH, isLikelyGibberish } from '@/lib/analysis-validation';
import type { AnalysisProvider } from '@/lib/types';
import type { StackAnalysis } from '@/lib/types';
import { analyzeProjectIntent, fetchFallbackProviders, AnalysisError } from '@/lib/gemini';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const HANDLER_TIMEOUT_MS = Number(process.env.ANALYZE_TIMEOUT_MS ?? 58_000);

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
  const started = Date.now();
  const trace = (step: string, detail = '') =>
    console.log(`[STACK2SET-PROBE] ${step}${detail ? ` ${detail}` : ''} (+${Date.now() - started}ms)`);

  let timer: NodeJS.Timeout | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new AnalysisError('Analysis timed out. Please try again.', 504)),
      HANDLER_TIMEOUT_MS,
    );
  });

  try {
    return await Promise.race([run(request, trace), timeoutPromise]);
  } catch (error) {
    if (error instanceof AnalysisError) {
      console.error(`[STACK2SET-PROBE] AnalysisError (${error.status}):`, error.message);
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('[STACK2SET-PROBE] Unexpected error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function run(request: NextRequest, trace: (s: string, d?: string) => void) {
  const body = await request.json();
  const description = String(body.description ?? '').trim();
  trace('IDEA_RECEIVED', JSON.stringify(description.slice(0, 80)));

  if (!description) {
    trace('EMPTY_DESCRIPTION');
    return NextResponse.json({ error: 'empty' }, { status: 400 });
  }
  if (description.length > MAX_DESCRIPTION_LENGTH) {
    trace('TOO_LONG');
    return NextResponse.json({ error: 'too long' }, { status: 400 });
  }
  if (isLikelyGibberish(description)) {
    trace('GIBBERISH');
    return NextResponse.json({ error: 'gibberish' }, { status: 422 });
  }

  const cacheKey = normalizeCacheKey(description);
  const cached = await providerService.getAnalysis(cacheKey);
  trace(`CACHE_READ ${cached ? 'HIT' : 'MISS'}`);
  if (cached) return NextResponse.json(cached as StackAnalysis);

  trace('CATEGORIES_FETCH_START');
  const allCategories = await providerService.getAllCategories();
  trace(`CATEGORIES_FETCH_DONE (${allCategories.length})`);
  const slugIndex = buildSlugIndex(allCategories);

  trace('GEMINI_REQUEST_START');
  const intent = await analyzeProjectIntent(description, Array.from(slugIndex.keys()));
  trace('GEMINI_SUCCESS');

  if (intent.isProject === false) {
    trace(`NOT_A_PROJECT: ${intent.isProjectReason}`);
    return NextResponse.json({ error: intent.isProjectReason, code: 'NOT_A_PROJECT' }, { status: 422 });
  }

  const categories: StackAnalysis['categories'] = [];
  const fallbackNeeded: Array<{ id: string; name: string; description: string }> = [];

  for (const cat of intent.categories) {
    const canonicalSlug = slugIndex.get(cat.id) ?? cat.id;
    let providers: AnalysisProvider[] = [];

    if (slugIndex.has(cat.id)) {
      trace(`PROVIDER_QUERY_START ${canonicalSlug}`);
      providers = await providerService.getCategoryProvidersAsAnalysis(canonicalSlug, 6);
      trace(`PROVIDER_QUERY_SUCCESS ${canonicalSlug} (${providers.length})`);
    } else {
      trace(`PROVIDER_QUERY_SKIP ${canonicalSlug} (not in catalog)`);
    }

    if (providers.length === 0) {
      fallbackNeeded.push({ id: canonicalSlug, name: cat.name, description: cat.description });
    }

    categories.push({
      id: canonicalSlug,
      name: cat.name,
      description: cat.description,
      confidence: cat.confidence,
      reasoning: cat.reasoning,
      providers,
    });
  }

  if (fallbackNeeded.length > 0) {
    trace(`FALLBACK_START (${fallbackNeeded.length} categories)`);
    const fallback = await fetchFallbackProviders(description, fallbackNeeded);
    trace('FALLBACK_SUCCESS');
    for (const category of categories) {
      const fallbackProviders = fallback[category.id];
      if (fallbackProviders && fallbackProviders.length > 0) {
        const flaggedProviders = fallbackProviders.map((provider) => ({
          ...provider,
          aiSuggested: true,
        }));
        category.providers = flaggedProviders;
        void providerService.storeFallbackCategoryAndProviders(
          { id: category.id, name: category.name, description: category.description },
          flaggedProviders,
        );
      }
    }
  }

  const analysis: StackAnalysis = {
    projectType: intent.projectType,
    summary: intent.summary,
    complexity: intent.complexity,
    categories,
    integrations: intent.integrations,
  };

  trace('CACHE_WRITE_START');
  await providerService.setAnalysis(cacheKey, analysis, description);
  trace('CACHE_WRITE_DONE');

  trace('SEARCH_COMPLETE');
  return NextResponse.json(analysis);
}
