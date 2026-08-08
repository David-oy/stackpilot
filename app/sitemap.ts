import type { MetadataRoute } from 'next';
import { absoluteUrl } from '@/lib/site';
import { allDocs } from '@/lib/docs';
import { providerService } from '@/lib/services/provider-service';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // Categories and providers come from the configured store (hosted Supabase in
  // production). The clean, indexable URL is `/browse/categories/{slug}` — never
  // the legacy query-string route `/category?id=...`.
  const dbCategories = await providerService.getAllCategories();

  const categoryPages: MetadataRoute.Sitemap = dbCategories.map((category) => {
    let lastModified = new Date(category.updatedAt);
    if (Number.isNaN(lastModified.getTime())) lastModified = now;
    return {
      url: absoluteUrl(`/browse/categories/${category.slug}`),
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.8,
    };
  });

  const providers = await providerService.getAllProviders();
  const providerPages: MetadataRoute.Sitemap = providers
    .filter((p) => p.status === 'active')
    .map((p) => {
      let lastModified = new Date(p.updatedAt);
      if (Number.isNaN(lastModified.getTime())) lastModified = now;
      return {
        url: absoluteUrl(`/browse/providers/${p.slug}`),
        lastModified,
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      };
    });

  const docPages: MetadataRoute.Sitemap = allDocs.map((doc) => ({
    url: absoluteUrl(`/docs/${doc.slug}`),
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  const staticPages: MetadataRoute.Sitemap = [
    '/features',
    '/explore',
    '/browse/providers',
    '/browse/categories',
    '/pricing',
    '/changelog',
    '/api-reference',
    '/blog',
    '/community',
    '/status',
    '/about',
    '/contact',
    '/privacy',
    '/terms',
  ].map((path) => ({
    url: absoluteUrl(path),
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.5,
  }));

  return [
    {
      url: absoluteUrl('/'),
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: absoluteUrl('/search'),
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    ...categoryPages,
    ...providerPages,
    {
      url: absoluteUrl('/faq'),
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: absoluteUrl('/docs'),
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    ...docPages,
    ...staticPages,
  ];
}
