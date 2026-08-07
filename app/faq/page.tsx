import type { Metadata } from 'next';
import { Footer } from '@/components/landing/footer';
import { Navbar } from '@/components/landing/navbar';
import { FaqAccordion } from '@/components/landing/faq-accordion';
import { siteConfig } from '@/lib/site';
import { faqSchema } from '@/lib/jsonld';
import { faqItems } from '@/lib/faq';

export const metadata: Metadata = {
  title: 'FAQ',
  description:
    'Answers to common questions about Stack2Set: how it works, whether it is free, how technologies are recommended, supported frameworks and databases, and more.',
  alternates: {
    canonical: '/faq',
  },
  openGraph: {
    type: 'website',
    title: `FAQ — ${siteConfig.name}`,
    description:
      'Answers to common questions about Stack2Set: how it works, whether it is free, and how technologies are recommended.',
  },
};

export default function FAQPage() {
  const jsonLd = faqSchema(faqItems);

  return (
    <main className="relative min-h-screen overflow-x-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar />

      <div className="relative overflow-hidden px-4 pb-24 pt-32 sm:px-6 sm:pt-36">
        <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[400px] w-[700px] -translate-x-1/2 rounded-full bg-violet-600/10 blur-[120px]" />

        <section className="mx-auto max-w-4xl">
          <header className="text-center">
            <p className="text-sm font-medium text-violet-400">FAQ</p>
            <h1 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-5xl">
              Frequently Asked <span className="gradient-text">Questions</span>
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">
              Everything you need to know about Stack2Set and how it recommends the best technology
              stack for your project.
            </p>
          </header>

          <div className="mt-12">
            <FaqAccordion items={faqItems} />
          </div>
        </section>
      </div>

      <Footer />
    </main>
  );
}
