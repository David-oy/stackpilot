import { NextRequest, NextResponse } from 'next/server';
import { suggestProviders, AnalysisError } from '@/lib/gemini';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const category = (searchParams.get('category') ?? '').trim().slice(0, 60);
  const project = (searchParams.get('project') ?? '').trim().slice(0, 2000);
  const existing = (searchParams.get('existing') ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 20);

  if (!category) {
    return NextResponse.json({ error: 'A category is required.' }, { status: 400 });
  }

  try {
    const suggestions = await suggestProviders(category, project, existing);
    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error('[api/providers/suggest] Error:', error);
    if (error instanceof AnalysisError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      { error: 'Failed to generate suggestions. Please try again.' },
      { status: 500 },
    );
  }
}
