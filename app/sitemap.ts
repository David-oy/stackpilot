import type { MetadataRoute } from 'next';
import { absoluteUrl } from '@/lib/site';
import { categories } from '@/lib/categories';
import { allDocs } from '@/lib/docs';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const categoryPages: MetadataRoute.Sitemap = categories.map((cat) => ({
    url: absoluteUrl(`/category?id=${cat.id}`),
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
