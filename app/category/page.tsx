import { permanentRedirect } from 'next/navigation';
import { providerService } from '@/lib/services/provider-service';

export const dynamic = 'force-dynamic';

type PageProps = {
  searchParams: { id?: string; name?: string };
};

export default async function LegacyCategoryRedirect({ searchParams }: PageProps) {
  const id = searchParams.id;
  if (id) {
    let slug: string | null = null;
    try {
      const category = await providerService.getCategoryBySlug(id);
      slug = category?.slug ?? null;
    } catch (error) {
      console.error('[category] Redirect lookup failed:', error);
    }
    if (slug) permanentRedirect(`/browse/categories/${slug}`);
  }
  permanentRedirect('/browse/categories');
}
