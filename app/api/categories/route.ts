import { NextResponse } from 'next/server';
import { providerService } from '@/lib/services/provider-service';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const categories = await providerService.getAllCategories();
    return NextResponse.json({ categories });
  } catch (error) {
    console.error('[api/categories] Error:', error);
    return NextResponse.json(
      { error: 'Failed to load categories.' },
      { status: 500 },
    );
  }
}
