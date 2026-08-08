import type { Metadata } from 'next';
import { SearchPage } from '@/components/search/search-page';
import { siteConfig, absoluteUrl } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Search',
  description:
    'Describe your project and Stack2Set will build your technology stack. Sign in to generate personalized results.',
  alternates: {
    canonical: '/search',
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: 'website',
    url: absoluteUrl('/search'),
    title: 'Search',
    description:
      'Describe your project and Stack2Set will build your technology stack.',
    siteName: siteConfig.openGraph.siteName,
    locale: siteConfig.openGraph.locale,
    images: [{ url: absoluteUrl('/og.svg'), width: 1200, height: 630, alt: siteConfig.name }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Search',
    description:
      'Describe your project and Stack2Set will build your technology stack.',
    images: [absoluteUrl('/og.svg')],
  },
};

export default function SearchRoute() {
  return <SearchPage />;
}
