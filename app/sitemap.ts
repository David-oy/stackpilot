import type { MetadataRoute } from 'next';
import { absoluteUrl } from '@/lib/site';
import { categories } from '@/lib/categories';
import { allDocs } from '@/lib/docs';
import { providerService } from '@/lib/services/provider-service';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  let categorySlugs: string[];
  try {
    const dbCategories = await providerService.getAllCategories();
    categorySlugs = dbCategories.map((c) => c.slug);
  } catch (error) {
    console.error('[sitemap] Falling back to static categories:', error);
    categorySlugs = categories.map((c) => c.id);
  }

  const categoryPages: MetadataRoute.Sitemap = categorySlugs.map((id) => ({
    url: absoluteUrl(`/category?id=${id}`),
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  const docPages: MetadataRoute.Sitemap = allDocs.map((doc) => ({
    url: absoluteUrl(`/docs/${doc.slug}`),
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  const staticPages: MetadataRoute.Sitemap = [
    '/features',
    '/explore',
    '/compare',
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
      url: absoluteUrl('/results'),
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    ...categoryPages,
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
