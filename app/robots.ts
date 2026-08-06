import type { MetadataRoute } from 'next';
import { siteConfig } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  const allow = {
    allow: ['/'],
    disallow: ['/api/'],
  };

  return {
    rules: [
      { userAgent: '*', ...allow },
      { userAgent: 'OAI-SearchBot', ...allow },
      { userAgent: 'GPTBot', ...allow },
      { userAgent: 'ClaudeBot', ...allow },
      { userAgent: 'Claude-Web', ...allow },
      { userAgent: 'PerplexityBot', ...allow },
      { userAgent: 'Googlebot', ...allow },
      { userAgent: 'Google-Extended', ...allow },
      { userAgent: 'Bingbot', ...allow },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url.replace(/^https?:\/\//, ''),
  };
}
