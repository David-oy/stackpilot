import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { userStackSchema } from '@/lib/stacks/repository';
import { getShareRepository } from '@/lib/stacks/share';
import { computeStackHealth, complexityDifficulty } from '@/lib/stacks/health';
import { absoluteUrl } from '@/lib/site';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const shareRequestSchema = z.object({
  stack: userStackSchema,
});

export async function POST(request: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
    }

    const parsed = shareRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'The stack data is invalid or incomplete.' },
        { status: 400 },
      );
    }

    const stack = parsed.data.stack;
    const health = computeStackHealth(stack);

    const payload = getShareRepository().create({
      name: stack.name,
      prompt: stack.prompt,
      projectType: stack.sourceAnalysis?.projectType,
      summary: stack.sourceAnalysis?.summary,
      complexity: stack.sourceAnalysis?.complexity,
      difficulty: complexityDifficulty(stack.sourceAnalysis?.complexity),
      estimatedMonthlyCost: health.estimatedMonthlyCost,
      categories: stack.categories,
      health,
      stackId: stack.id,
    });

    return NextResponse.json({
      id: payload.id,
      url: absoluteUrl(`/stack/${payload.id}`),
    });
  } catch (error) {
    console.error('[api/share] Error:', error);
    return NextResponse.json(
      { error: 'Failed to create a share link.' },
      { status: 500 },
    );
  }
}
