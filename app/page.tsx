import type { Metadata } from 'next';
import { Navbar } from '@/components/landing/navbar';
import { Hero } from '@/components/landing/hero';
import { HowItWorks } from '@/components/landing/how-it-works';
import { Features } from '@/components/landing/features';
import { CTA } from '@/components/landing/cta';
import { Footer } from '@/components/landing/footer';
import { siteConfig, absoluteUrl } from '@/lib/site';
import {
  organizationSchema,
  websiteSchema,
  webApplicationSchema,
  softwareApplicationSchema,
} from '@/lib/jsonld';

export const metadata: Metadata = {
  description: siteConfig.description,
  keywords: siteConfig.keywords,
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    url: siteConfig.url,
    title: siteConfig.title,
    description: siteConfig.description,
    siteName: siteConfig.openGraph.siteName,
    locale: siteConfig.openGraph.locale,
    images: [{ url: absoluteUrl('/og.svg'), width: 1200, height: 630, alt: siteConfig.name }],
  },
  twitter: {
    card: 'summary_large_image',
    title: siteConfig.title,
    description: siteConfig.description,
    images: [absoluteUrl('/og.svg')],
  },
};

const jsonLd = [
  organizationSchema(),
  websiteSchema(),
  webApplicationSchema(),
  softwareApplicationSchema(),
];

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-x-hidden">
      {jsonLd.map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
      <Navbar />
      <Hero />
      <HowItWorks />
      <Features />
      <CTA />
      <Footer />
    </main>
  );
}
