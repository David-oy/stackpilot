import type { Metadata } from 'next';
import { siteConfig, absoluteUrl } from '@/lib/site';
import { breadcrumbSchema } from '@/lib/jsonld';
import { ResultsView } from './results-view';

type PageProps = {
  searchParams: { q?: string };
};

export function generateMetadata({ searchParams }: PageProps): Metadata {
  const q = (searchParams.q ?? '').trim();
  const title = q ? `Tech stack for ${q}` : 'Tech stack results';
  const description = q
    ? `AI-recommended technology stack, providers, and tools for building a ${q} app. Compare databases, authentication, hosting, and more.`
    : 'View the AI-recommended technology stack for your project, including ranked providers, comparisons, and recommended tools.';

  return {
    title,
    description,
    alternates: {
      canonical: '/results',
    },
    openGraph: {
      type: 'website',
      url: absoluteUrl('/results'),
      title: `${title} — ${siteConfig.name}`,
      description,
      siteName: siteConfig.openGraph.siteName,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} — ${siteConfig.name}`,
      description,
    },
  };
}

export default function ResultsPage() {
  const jsonLd = breadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Results', url: '/results' },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ResultsView />
    </>
  );
}
