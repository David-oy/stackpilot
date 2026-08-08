import type { Metadata } from 'next';
import { CalendarDays, Check } from 'lucide-react';
import { Navbar } from '@/components/landing/navbar';
import { Footer } from '@/components/landing/footer';

export const metadata: Metadata = {
  title: 'Changelog',
  description: 'Recent updates, improvements, and fixes to Stack2Set.',
  alternates: { canonical: '/changelog' },
};

const entries = [
  {
    version: '2.4.1',
    date: 'August 2026',
    items: [
      'New floating badges on the homepage',
      'Redesigned feature cards with gradient borders',
      'FAQ section with search and filters on the homepage',
      'Full documentation site with sidebar, TOC, and code highlighting',
      'New static pages: features, explore, compare, pricing, and more',
    ],
  },
  {
    version: '2.1.0',
    date: 'July 2026',
    items: [
      'Top 6 ranked providers per category with best use cases',
      'Provider website and documentation links in results',
      'Robots.txt, sitemap.xml, and llms.txt for discoverability',
      'Structured data (JSON-LD) across the site',
    ],
  },
  {
    version: '1.2.0',
    date: 'June 2026',
    items: [
      'AI provider fallback when static data is missing',
      'Fixed category navigation bug',
      'Improved loading screen with progress steps',
    ],
  },
  {
    version: '1.1.0',
    date: 'May 2026',
    items: [
      'Gemini-powered analysis of project descriptions',
      'Category pages with ranked providers',
      'Compare providers across technology categories',
    ],
  },
  {
    version: '1.0.0',
    date: 'April 2026',
    items: ['Initial release of Stack2Set', 'Core search and results experience'],
  },
];

export default function ChangelogPage() {
  return (
    <main className="relative min-h-screen overflow-x-hidden">
      <Navbar />
      <div className="relative overflow-hidden px-4 pb-24 pt-32 sm:px-6 sm:pt-36">
        <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[400px] w-[700px] -translate-x-1/2 rounded-full bg-teal-500/10 blur-[120px]" />

        <header className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-medium text-teal-400">Changelog</p>
          <h1 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-5xl">
            What&apos;s <span className="gradient-text">new</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Recent updates, improvements, and fixes to Stack2Set.
          </p>
        </header>

        <div className="mx-auto mt-16 max-w-2xl space-y-6">
          {entries.map((entry) => (
            <article key={entry.version} className="glass glass-hover rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-foreground">v{entry.version}</h2>
                <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {entry.date}
                </span>
              </div>
              <ul className="mt-4 space-y-2.5">
                {entry.items.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500/15">
                      <Check className="h-2.5 w-2.5 text-emerald-400" />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
      <Footer />
    </main>
  );
}
