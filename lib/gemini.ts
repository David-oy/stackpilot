import { z } from 'zod';
import type { AnalysisProvider, Complexity } from './types';

const MODEL = process.env.GEMINI_MODEL ?? 'gemini-3.5-flash-lite';

const GEMINI_TIMEOUT_MS = Number(process.env.GEMINI_TIMEOUT_MS ?? 50_000);

export type GeminiIntentCategory = {
  id: string;
  name: string;
  description: string;
  confidence?: number;
  reasoning?: string;
};

export type GeminiIntegrationCategory = {
  id: string;
  name: string;
  description: string;
  providers: AnalysisProvider[];
};

export type GeminiIntent = {
  projectType: string;
  summary: string;
  complexity: Complexity;
  categories: GeminiIntentCategory[];
  integrations: GeminiIntegrationCategory[];
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

function buildIntentSystemPrompt(knownCategorySlugs: string[]): string {
  return `You are Stack2Set, an expert software architect. Analyze a software project idea and return ONLY the technology categories (domains) required to build it, PLUS the project-specific external integrations (APIs, SDKs, services, datasets, and developer tools) the project will rely on.

INTENT-ONLY RULE FOR TECHNOLOGY CATEGORIES:
The backend resolves actual providers for technology categories from its own curated database. You MUST NOT invent or return any providers for technology categories. Return only the category id, name, description, a confidence score, and a short reasoning.

STEP 1 — UNDERSTAND THE PROJECT DOMAIN
Identify the domain the project belongs to, e.g.: Game Deals, AI Chatbot, Food Delivery, Video Streaming, E-commerce, Social Network, Finance, Healthcare, Education, Music, Maps, Travel, Real Estate, IoT, Cybersecurity, DevTools, Productivity, Blockchain, etc.

STEP 2 — DETECT ALL EXTERNAL INTEGRATIONS
Determine every external API, SDK, official platform API, public dataset, search API, AI provider, payment provider, authentication provider, analytics, notifications, email provider, maps, cloud service, CDN, search engine, web scraping tool, monitoring, logging, media service, video API, OCR API, translation API, speech API, image API, gaming API, weather API, finance API, sports API, news API, government API, and open data API the project would realistically integrate with. Only include categories genuinely relevant to the project's domain.

Return ONLY valid JSON. Do not wrap it in markdown, code fences, or add any commentary. The JSON must match exactly this schema:

{
  "projectType": "short label for the kind of app, e.g. Game Deals Platform",
  "summary": "2-3 sentence overview of what building this project requires",
  "complexity": "Low" | "Medium" | "High",
  "technologyCategories": [
    {
      "id": "lowercase kebab-case slug",
      "name": "Human readable category name",
      "description": "Why this technology category is needed for this project",
      "confidence": 90,
      "reasoning": "Brief justification for including this category"
    }
  ],
  "projectIntegrations": [
    {
      "category": "Game APIs",
      "description": "Why these APIs matter for this project",
      "providers": []
    }
  ]
}

Rules for technologyCategories:
- Always include between 3 and 7 core technology categories genuinely required to build the project (e.g. frontend, backend, database, authentication, hosting, caching, storage).
- Use exactly the category id from this curated list whenever one matches; otherwise create a clean lowercase kebab-case id: ${knownCategorySlugs.join(', ')}
- confidence is an integer from 1 to 100 reflecting how certain you are this category is required.
- reasoning is 1-2 sentences. Never include providers here.

Rules for projectIntegrations:
- Return between 1 and 8 integration categories. Every category must be genuinely relevant to this project's domain — never return a generic list that would apply to any project.
- For EVERY integration provider include ALL of these fields:
  { "id": "lowercase kebab-case slug", "rank": 1, "name": "Provider name", "description": "Short description of what this API/service does", "reason": "Why this API/service fits this project", "website": "https://official-website.com", "documentation": "https://docs-url.com", "freeTier": true, "pricingModel": "Free" | "Freemium" | "Subscription" | "Usage-based" | "Per-seat" | "Paid", "popularityScore": 8, "openSource": false, "tags": ["tag1", "tag2"] }
- popularityScore is an integer from 1 to 10, where 10 means the most widely used and adopted.
- Return providers ranked best to least, up to 8 per category. Only recommend providers that actually exist. If a URL is unknown return an empty string. Never invent URLs.
- Example: for a project about discounted games, the category "Game APIs" should include providers like CheapShark, Steam Web API, RAWG, IGDB, and IsThereAnyDeal.`;
}

const providerSchema = z.object({
  id: z.string().trim().min(1),
  rank: z.number().int().min(1).max(6).optional(),
  name: z.string().trim().min(1),
  description: z.string().trim().min(1),
  reason: z.string().trim().min(1).optional(),
  bestUseCases: z
    .union([z.array(z.string().trim().min(1)), z.string().trim().min(1)])
    .transform((value) =>
      Array.isArray(value)
        ? value
        : value
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
    )
    .optional()
    .default([]),
  website: z.string().trim().optional().default(''),
  documentation: z.string().trim().optional().default(''),
  freeTier: z
    .union([z.boolean(), z.string().trim()])
    .transform((value) => (typeof value === 'boolean' ? value : value.toLowerCase() === 'true'))
    .optional()
    .default(false),
  pricingModel: z.string().trim().optional().default(''),
  popularityScore: z
    .union([z.number().min(1).max(10), z.string().trim()])
    .transform((value) => {
      if (typeof value === 'number') return value;
      const parsed = Number(value);
      return Number.isFinite(parsed) && parsed >= 1 && parsed <= 10 ? parsed : undefined;
    })
    .optional(),
  openSource: z
    .union([z.boolean(), z.string().trim()])
    .transform((value) => (typeof value === 'boolean' ? value : value.toLowerCase() === 'true'))
    .optional()
    .default(false),
  tags: z.array(z.string().trim().min(1)).optional().default([]),
});

const geminiIntentCategorySchema = z.object({
  id: z.string().trim().min(1),
  name: z.string().trim().min(1),
  description: z.string().trim().min(1),
  confidence: z
    .union([z.number().min(1).max(100), z.string().trim()])
    .transform((value) => {
      if (typeof value === 'number') return Math.round(value);
      const parsed = Number(value);
      return Number.isFinite(parsed) ? Math.round(Math.min(100, Math.max(1, parsed))) : undefined;
    })
    .optional(),
  reasoning: z.string().trim().optional().default(''),
});

const geminiIntegrationCategorySchema = z.object({
  category: z.string().trim().min(1).optional(),
  name: z.string().trim().min(1).optional(),
  description: z.string().trim().optional().default(''),
  providers: z.array(providerSchema).min(1),
});

const intentSchema = z.object({
  projectType: z.string().trim().min(1),
  summary: z.string().trim().min(1).optional().default(''),
  complexity: z.enum(['Low', 'Medium', 'High']),
  technologyCategories: z.array(geminiIntentCategorySchema).optional(),
  categories: z.array(geminiIntentCategorySchema).optional(),
  projectIntegrations: z.array(geminiIntegrationCategorySchema).optional().default([]),
});

const fallbackSchema = z.object({
  categories: z
    .array(
      z.object({
        id: z.string().trim().min(1),
        providers: z.array(providerSchema).min(1),
      }),
    )
    .min(1),
});

export class AnalysisError extends Error {
  status: number;

  constructor(message: string, status = 500) {
    super(message);
    this.name = 'AnalysisError';
    this.status = status;
  }
}

type GeminiCandidate = {
  finishReason?: string;
  content?: { parts?: Array<{ text?: string }> };
};

function extractGeminiText(payload: unknown): string {
  if (!payload || typeof payload !== 'object') {
    throw new AnalysisError('Gemini returned an unexpected response.');
  }

  const candidates = (payload as { candidates?: unknown }).candidates;
  if (!Array.isArray(candidates) || candidates.length === 0) {
    throw new AnalysisError('Gemini returned no candidates.');
  }

  const candidate = candidates[0] as GeminiCandidate;
  if (candidate?.finishReason && candidate.finishReason !== 'STOP') {
    throw new AnalysisError(`Gemini stopped generation: ${candidate.finishReason}.`);
  }

  const text = candidate?.content?.parts?.[0]?.text;
  if (typeof text !== 'string' || text.trim().length === 0) {
    throw new AnalysisError('Gemini returned an empty response.');
  }

  return text;
}

function parseJsonResponse(text: string): unknown {
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start !== -1 && end > start) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1));
      } catch {
        // fall through to the error below
      }
    }
    throw new AnalysisError('Gemini did not return valid JSON.');
  }
}

async function callGemini(
  systemPrompt: string,
  userText: string,
): Promise<unknown> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new AnalysisError('GEMINI_API_KEY is not configured. Add it to .env.local.', 500);
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [
        {
          role: 'user',
          parts: [{ text: userText }],
        },
      ],
      generationConfig: {
        responseMimeType: 'application/json',
      },
    }),
    cache: 'no-store',
    signal: AbortSignal.timeout(GEMINI_TIMEOUT_MS),
  });

  if (!response.ok) {
    let detail = '';
    try {
      const body = (await response.json()) as { error?: { message?: string } };
      detail = body?.error?.message ?? '';
    } catch {
      // response body is not JSON; ignore
    }
    throw new AnalysisError(
      `Gemini API request failed (${response.status}).${detail ? ` ${detail}` : ''}`,
      502,
    );
  }

  const payload: unknown = await response.json();
  const text = extractGeminiText(payload);
  const parsed = parseJsonResponse(text);
  return parsed;
}

function toAnalysisProvider(p: z.infer<typeof providerSchema>): AnalysisProvider {
  return {
    id: p.id,
    rank: p.rank,
    name: p.name,
    description: p.description,
    reason: p.reason,
    bestUseCases: p.bestUseCases,
    website: p.website || undefined,
    documentation: p.documentation || undefined,
    freeTier: p.freeTier,
    pricingModel: p.pricingModel || undefined,
    popularityScore:
      typeof p.popularityScore === 'number'
        ? Math.min(100, Math.round(p.popularityScore * 10))
        : undefined,
    openSource: p.openSource,
    tags: p.tags,
  };
}

function toIntegrationCategory(
  cat: z.infer<typeof geminiIntegrationCategorySchema>,
): GeminiIntegrationCategory {
  const name = cat.category ?? cat.name ?? '';
  return {
    id: slugify(name),
    name,
    description: cat.description,
    providers: cat.providers.map(toAnalysisProvider),
  };
}

export async function analyzeProjectIntent(
  description: string,
  knownCategorySlugs: string[],
): Promise<GeminiIntent> {
  const parsed = await callGemini(
    buildIntentSystemPrompt(knownCategorySlugs),
    `Project to analyze:\n${description}`,
  );

  const result = intentSchema.safeParse(parsed);
  if (!result.success) {
    throw new AnalysisError('Gemini returned a response that did not match the expected schema.');
  }

  const techCategories = result.data.technologyCategories ?? result.data.categories ?? [];
  if (techCategories.length === 0) {
    throw new AnalysisError('Gemini returned a response that did not match the expected schema.');
  }

  return {
    projectType: result.data.projectType,
    summary: result.data.summary,
    complexity: result.data.complexity,
    categories: techCategories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      description: cat.description,
      confidence: cat.confidence,
      reasoning: cat.reasoning || undefined,
    })),
    integrations: result.data.projectIntegrations.map(toIntegrationCategory),
  };
}

export async function fetchFallbackProviders(
  description: string,
  categories: Array<{ id: string; name: string; description: string }>,
): Promise<Record<string, AnalysisProvider[]>> {
  const prompt = `You are Stack2Set, an expert software architect. For the project described below, recommend the TOP 6 providers for each of the listed technology categories.

Return ONLY valid JSON matching exactly this schema:
{
  "categories": [
    {
      "id": "the category id you were given",
      "providers": [
        {
          "id": "lowercase kebab-case slug",
          "rank": 1,
          "name": "Provider name",
          "description": "Short description of what this provider does",
          "reason": "Why this provider is recommended for this project",
          "bestUseCases": ["use case 1", "use case 2", "use case 3"],
          "website": "https://official-website.com",
          "documentation": "https://docs-url.com"
        }
      ]
    }
  ]
}

Rules:
- Return a "categories" entry for EVERY category id you were given, in the same order.
- Rank providers 1 (best) to 6. Choose based on popularity, reliability, production readiness, maintenance, community adoption, documentation, free tier, integration ease, security, scalability, and performance.
- If the official website or documentation URL is unknown, return an empty string. Never invent URLs.
- Do not recommend the same provider twice within a category.

Categories to fill:
${categories.map((c) => `- ${c.id} (${c.name}): ${c.description}`).join('\n')}

Project to analyze:
${description}`;

  const parsed = await callGemini(prompt, 'Fill in the providers for the categories above.');

  const result = fallbackSchema.safeParse(parsed);
  if (!result.success) {
    throw new AnalysisError('Gemini returned a response that did not match the expected schema.');
  }

  const byId: Record<string, AnalysisProvider[]> = {};
  for (const cat of result.data.categories) {
    byId[cat.id] = cat.providers.map(toAnalysisProvider);
  }
  return byId;
}
