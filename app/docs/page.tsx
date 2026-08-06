import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Footer } from '@/components/landing/footer';
import { Navbar } from '@/components/landing/navbar';
import { siteConfig } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Documentation',
  description:
    'Learn how to use StackPilot: describe your project, review AI-recommended technology categories, compare providers, and build your tech stack.',
  alternates: {
    canonical: '/docs',
  },
  openGraph: {
    type: 'website',
    title: `Documentation — ${siteConfig.name}`,
    description:
      'Learn how to use StackPilot to discover and assemble the perfect technology stack for your project.',
  },
};

const sections = [
  {
    title: 'Getting Started',
    body: 'Go to the homepage, type a short description of the project you want to build (for example, "I want to build a YouTube clone"), and press search. StackPilot analyzes your idea and returns a complete technology stack.',
  },
  {
    title: 'How It Works',
    body: 'StackPilot identifies the technology categories your project genuinely requires, then recommends ranked providers for each category based on popularity, reliability, production readiness, documentation quality, free-tier availability, and more.',
  },
  {
    title: 'Understanding Results',
    body: 'The results page shows every recommended technology category with its providers. Open any category to browse the full provider list, compare options, and see which ones have free tiers or are open source.',
  },
  {
    title: 'Technology Categories',
    body: 'Common categories include databases, authentication, storage, hosting, CDN, email, notifications, analytics, and AI tools. StackPilot covers additional categories as your project requires them.',
  },
  {
    title: 'Building Your Stack',
    body: 'Add a provider to your stack from any category page, review your current stack, and export it once you are ready. Your stack is saved automatically as you go.',
  },
];

export default function DocsPage() {
  return (
    <main className="relative min-h-screen overflow-x-hidden">
      <Navbar />

      <div className="relative overflow-hidden px-6 pb-20 pt-32">
        <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[400px] w-[700px] -translate-x-1/2 rounded-full bg-violet-600/10 blur-[120px]" />

        <div className="mx-auto max-w-3xl">
          <nav aria-label="Breadcrumb">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to home
            </Link>
          </nav>

          <header className="mt-8">
            <p className="text-sm font-medium text-violet-400">Documentation</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
              How StackPilot <span className="gradient-text">works</span>
            </h1>
            <p className="mt-4 max-w-xl text-lg text-muted-foreground">
              A short guide to discovering, comparing, and assembling your technology stack with {siteConfig.name}.
            </p>
          </header>

          <section className="mt-12 space-y-4">
            {sections.map((section) => (
              <article key={section.title} className="glass glass-hover rounded-2xl p-6">
                <h2 className="text-base font-semibold text-foreground">{section.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{section.body}</p>
              </article>
            ))}
          </section>

          <section className="mt-8 rounded-2xl glass p-6">
            <h2 className="text-base font-semibold text-foreground">Need more help?</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Check the{' '}
              <Link href="/faq" className="text-violet-400 transition-colors hover:text-violet-300">
                frequently asked questions
              </Link>
              .
            </p>
          </section>
        </div>
      </div>

      <Footer />
    </main>
  );
}
