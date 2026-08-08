import type { Metadata } from 'next';
import { BrowseCategories } from '@/components/browse/categories';
import { siteConfig, absoluteUrl } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Browse Categories',
  description:
    'Explore technology categories — from frontend and backend to AI, payments, and video APIs. Find and compare providers for every part of your stack.',
  alternates: {
    canonical: '/browse/categories',
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: 'website',
    url: absoluteUrl('/browse/categories'),
    title: 'Browse Categories',
    description:
      'Explore technology categories — from frontend and backend to AI, payments, and video APIs.',
    siteName: siteConfig.openGraph.siteName,
    locale: siteConfig.openGraph.locale,
    images: [{ url: absoluteUrl('/og.svg'), width: 1200, height: 630, alt: siteConfig.name }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Browse Categories',
    description:
      'Explore technology categories — from frontend and backend to AI, payments, and video APIs.',
    images: [absoluteUrl('/og.svg')],
  },
};

export default function BrowseCategoriesPage() {
  return <BrowseCategories />;
}
