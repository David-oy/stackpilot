import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { analyzeWithGemini, AnalysisError } from '@/lib/gemini';

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

    const analysis = await analyzeWithGemini(parsed.data.description);

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
