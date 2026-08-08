import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { providerService } from '@/lib/services/provider-service';
import { normalizeCacheKey } from '@/lib/db/cache';
import { getRouteSession } from '@/lib/supabase/route-user';
import { checkRateLimit } from '@/lib/rate-limit';
import type { AnalysisProvider } from '@/lib/types';
import type { StackAnalysis } from '@/lib/types';
import {
  analyzeProjectIntent,
  fetchFallbackProviders,
  isLikelyGibberish,
  AnalysisError,
} from '@/lib/gemini';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
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

  const session = await getRouteSession();
  if (!session?.user) {
    trace('unauthorized — no session');
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }
  trace('session verified');

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

  // Reject obvious gibberish before touching the cache or paying for AI.
  if (isLikelyGibberish(parsed.data.description)) {
    trace('rejected — not a project (heuristic)');
    return NextResponse.json(
      {
        error:
          'That doesn\u2019t look like a software project. Try describing what you want to build, e.g. "a video streaming app like Netflix".',
        code: 'NOT_A_PROJECT',
      },
      { status: 422 },
    );
  }

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

  // Only the uncached (Gemini-billed) path is rate limited so repeat requests
  // that hit the cache are never throttled.
  const rate = checkRateLimit(session.user.id);
  if (!rate.allowed) {
    trace(`rate limited (retry in ${rate.retryAfterSec}s)`);
    return NextResponse.json(
      { error: `Too many requests. Please try again in ${rate.retryAfterSec}s.` },
      {
        status: 429,
        headers: { 'Retry-After': String(rate.retryAfterSec) },
      },
    );
  }

  const categoriesStart = Date.now();
  const allCategories = await providerService.getAllCategories();
  trace(
    `provider db: getAllCategories (${Date.now() - categoriesStart}ms, ${allCategories.length} categories)`,
  );

  const slugIndex = buildSlugIndex(allCategories);

  const geminiStart = Date.now();
  const intent = await analyzeProjectIntent(
    parsed.data.description,
    Array.from(slugIndex.keys()),
  );
  trace(`gemini intent analysis (${Date.now() - geminiStart}ms)`);

  if (intent.isProject === false) {
    trace(`rejected — not a project (${intent.isProjectReason})`);
    return NextResponse.json(
      {
        error:
          intent.isProjectReason ||
          'That doesn\u2019t look like a software project. Try describing what you want to build, e.g. "a video streaming app like Netflix".',
        code: 'NOT_A_PROJECT',
      },
      { status: 422 },
    );
  }

  const categories: StackAnalysis['categories'] = [];
  const fallbackNeeded: Array<{ id: string; name: string; description: string }> = [];

  for (const cat of intent.categories) {
    const canonicalSlug = slugIndex.get(cat.id) ?? cat.id;
    let providers: AnalysisProvider[] = [];

    if (slugIndex.has(cat.id)) {
      const lookupStart = Date.now();
      providers = await providerService.getCategoryProvidersAsAnalysis(canonicalSlug, 6);
      trace(
        `provider lookup ${canonicalSlug} (${Date.now() - lookupStart}ms, ${providers.length} providers)`,
      );
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
