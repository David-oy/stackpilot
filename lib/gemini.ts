import { z } from 'zod';
import type { AnalysisProvider, Complexity, StackAnalysis } from './types';

const MODEL = process.env.GEMINI_MODEL ?? 'gemini-3.5-flash-lite';

export type GeminiCategory = {
  id: string;
  name: string;
  description: string;
  providers: AnalysisProvider[];
};

export type GeminiAnalysis = {
  projectType: string;
  summary: string;
  complexity: Complexity;
  categories: GeminiCategory[];
};

function buildSystemPrompt(knownCategorySlugs: string[]): string {
  return `You are StackPilot, an expert software architect and developer. Your job is to analyze a software project idea and return the technology categories required to build it.

Return ONLY valid JSON. Do not wrap it in markdown, code fences, or add any commentary. The JSON must match exactly this schema:

{
  "projectType": "short label for the kind of app, e.g. Video Streaming Platform",
  "summary": "2-3 sentence overview of what building this project requires",
  "complexity": "Low" | "Medium" | "High",
  "categories": [
    {
      "id": "lowercase kebab-case slug",
      "name": "Human readable category name",
      "description": "Why this technology category is needed for this project",
      "providers": []
    }
  ]
}

Rules:
- Always include between 3 and 7 categories.
- Only include categories that are genuinely required by the described project.
- The following category ids are already curated in our database. When one matches, use exactly that id and return an EMPTY "providers" array for it: ${knownCategorySlugs.join(', ')}.
- For any OTHER category (not in that list), return the top 6 providers with full details using this provider shape:
  { "id": "lowercase kebab-case slug", "rank": 1, "name": "Provider name", "description": "Short description of what this provider does", "reason": "Why this provider is recommended", "bestUseCases": ["use case 1", "use case 2", "use case 3"], "website": "https://...", "documentation": "https://..." }
- For providers, return ONLY the TOP 6, ranked best to least. Choose based on popularity, reliability, production readiness, maintenance, community adoption, documentation quality, free tier, integration ease, security, scalability, and performance.
- For every provider include: rank, name, short description, why it is recommended, best use cases, official website, documentation URL. If a URL is unknown return an empty string. Never invent URLs.
- complexity should reflect overall build effort: "Low", "Medium", or "High".`;
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
});

const geminiCategorySchema = z.object({
  id: z.string().trim().min(1),
  name: z.string().trim().min(1),
  description: z.string().trim().min(1),
  providers: z.array(providerSchema).optional().default([]),
});

const analysisSchema = z.object({
  projectType: z.string().trim().min(1),
  summary: z.string().trim().min(1),
  complexity: z.enum(['Low', 'Medium', 'High']),
  categories: z.array(geminiCategorySchema).min(1),
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
    signal: AbortSignal.timeout(60_000),
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
  };
}

export async function analyzeWithGemini(
  description: string,
  knownCategorySlugs: string[],
): Promise<GeminiAnalysis> {
  const parsed = await callGemini(
    buildSystemPrompt(knownCategorySlugs),
    `Project to analyze:\n${description}`,
  );

  const result = analysisSchema.safeParse(parsed);
  if (!result.success) {
    throw new AnalysisError('Gemini returned a response that did not match the expected schema.');
  }

  return {
    projectType: result.data.projectType,
    summary: result.data.summary,
    complexity: result.data.complexity,
    categories: result.data.categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      description: cat.description,
      providers: cat.providers.map(toAnalysisProvider),
    })),
  };
}

export async function fetchFallbackProviders(
  description: string,
  categories: Array<{ id: string; name: string; description: string }>,
): Promise<Record<string, AnalysisProvider[]>> {
  const prompt = `You are StackPilot, an expert software architect. For the project described below, recommend the TOP 6 providers for each of the listed technology categories.

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

export function toStackAnalysis(gemini: GeminiAnalysis): StackAnalysis {
  return {
    projectType: gemini.projectType,
    summary: gemini.summary,
    complexity: gemini.complexity,
    categories: gemini.categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      description: cat.description,
      providers: cat.providers,
    })),
  };
}
