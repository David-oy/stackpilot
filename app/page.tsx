import type { Metadata } from 'next';
import { Navbar } from '@/components/landing/navbar';
import { Hero } from '@/components/landing/hero';
import { HowItWorks } from '@/components/landing/how-it-works';
import { FloatingBadges } from '@/components/landing/floating-badges';
import { Features } from '@/components/landing/features';
import { FaqSection } from '@/components/landing/faq-section';
import { DocsSection } from '@/components/landing/docs-section';
import { CTA } from '@/components/landing/cta';
import { Footer } from '@/components/landing/footer';
import { DynamicIsland } from '@/components/landing/dynamic-island';
import { ScrollLightField, LightReveal, SectionGlow } from '@/components/cinematic/scroll-lighting';
import { siteConfig, absoluteUrl } from '@/lib/site';
import {
  organizationSchema,
  websiteSchema,
  webApplicationSchema,
  softwareApplicationSchema,
  serializeJsonLd,
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
    <main className="relative min-h-screen overflow-x-hidden pb-28">
      {jsonLd.map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(schema) }}
        />
      ))}
      <ScrollLightField />
      <Navbar />
      <Hero />
      <LightReveal className="relative">
        <SectionGlow glow="purple" />
        <HowItWorks />
      </LightReveal>
      <FloatingBadges />
      <LightReveal className="relative">
        <SectionGlow glow="indigo" />
        <Features />
      </LightReveal>
      <FaqSection />
      <DocsSection />
      <LightReveal className="relative">
        <SectionGlow glow="pink" />
        <CTA />
      </LightReveal>
      <Footer />
      <DynamicIsland />
    </main>
  );
}
