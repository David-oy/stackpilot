import { z } from 'zod';
import type { StackAnalysis } from './types';

const MODEL = process.env.GEMINI_MODEL ?? 'gemini-3.5-flash-lite';

const SYSTEM_PROMPT = `You are StackPilot, an expert software architect and developer. Your job is to analyze a software project idea and return the complete technology stack required to build it.

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
- Always include between 3 and 7 categories.
- Only include categories that are genuinely required by the described project.
- For every technology category, return ONLY the TOP 6 providers, ranked from best to least recommended. Do not recommend duplicate providers; if multiple providers are very similar, return only the best one.
- Choose providers based on: popularity, reliability, production readiness, active maintenance, community adoption, quality of documentation, free tier (when available), ease of integration, security, scalability, and performance.
- Return providers in this order:
  rank 1 = best overall recommendation,
  rank 2 = best alternative,
  rank 3 = excellent choice,
  rank 4 = good production option,
  rank 5 = specialized option,
  rank 6 = beginner-friendly or niche option.
- For every provider, return: rank, name, short description, why it is recommended, best use cases, official website, and documentation URL.
- If the official website or documentation URL is unknown, return an empty string. Never invent URLs.
- When a category matches one of the known ids, use exactly that id: authentication, database, storage, video-apis, cdn, email, notifications, analytics, hosting. For any other category, create your own concise kebab-case id.
- complexity should reflect the overall build effort: "Low", "Medium", or "High".`;

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

const categorySchema = z.object({
  id: z.string().trim().min(1),
  name: z.string().trim().min(1),
  description: z.string().trim().min(1),
  providers: z.array(providerSchema).optional().default([]),
});

const analysisSchema = z.object({
  projectType: z.string().trim().min(1),
  summary: z.string().trim().min(1),
  complexity: z.enum(['Low', 'Medium', 'High']),
  categories: z.array(categorySchema).min(1),
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

export async function analyzeWithGemini(description: string): Promise<StackAnalysis> {
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
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [
        {
          role: 'user',
          parts: [{ text: `Project to analyze:\n${description}` }],
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
  const result = analysisSchema.safeParse(parsed);

  if (!result.success) {
    throw new AnalysisError('Gemini returned a response that did not match the expected schema.');
  }

  return result.data as StackAnalysis;
}
