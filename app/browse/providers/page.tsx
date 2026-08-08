import type { Metadata } from 'next';
import { BrowseProviders } from '@/components/browse/providers';
import { siteConfig, absoluteUrl } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Browse Providers',
  description:
    'Browse and compare providers from the Stack2Set database. Filter by category, pricing, free tier, and open source.',
  alternates: {
    canonical: '/browse/providers',
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: 'website',
    url: absoluteUrl('/browse/providers'),
    title: 'Browse Providers',
    description:
      'Browse and compare providers from the Stack2Set database. Filter by category, pricing, and more.',
    siteName: siteConfig.openGraph.siteName,
    locale: siteConfig.openGraph.locale,
    images: [{ url: absoluteUrl('/og.svg'), width: 1200, height: 630, alt: siteConfig.name }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Browse Providers',
    description:
      'Browse and compare providers from the Stack2Set database. Filter by category, pricing, and more.',
    images: [absoluteUrl('/og.svg')],
  },
};

export default function BrowseProvidersPage() {
  return <BrowseProviders />;
}
