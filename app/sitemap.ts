import type { MetadataRoute } from 'next';
import { absoluteUrl } from '@/lib/site';
import { categories } from '@/lib/categories';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const categoryPages: MetadataRoute.Sitemap = categories.map((cat) => ({
    url: absoluteUrl(`/category?id=${cat.id}`),
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.8,
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
      priority: 0.5,
    },
    {
      url: absoluteUrl('/blog'),
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.4,
    },
  ];
}
