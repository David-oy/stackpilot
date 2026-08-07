import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  GitCompare,
  Sparkles,
  Terminal,
  ListChecks,
  GraduationCap,
  Lightbulb,
  FileText,
  HelpCircle,
} from 'lucide-react';
import { CodeBlock } from '@/components/docs/code-block';
import { siteConfig } from '@/lib/site';
import { docGroups } from '@/lib/docs';
import { categories } from '@/lib/categories';
import { breadcrumbSchema } from '@/lib/jsonld';

export const metadata: Metadata = {
  title: 'Documentation',
  description:
    'Learn how to use Stack2Set: describe your project, review AI-recommended technology categories, compare providers, and build your tech stack.',
  alternates: {
    canonical: '/docs',
  },
  openGraph: {
    type: 'website',
    title: `Documentation — ${siteConfig.name}`,
    description:
      'Learn how to use Stack2Set to discover and assemble the perfect technology stack for your project.',
  },
};

const quickStartCode = `# 1. Describe your project on the homepage
"I want to build a YouTube clone"

# 2. Stack2Set analyzes it with AI
# 3. Review categories, compare providers
# 4. Build and export your stack`;

const tutorialLinks = [
  { slug: 'getting-started', title: 'Getting Started', description: 'Your first stack in three steps' },
  { slug: 'search', title: 'Search', description: 'Write better project descriptions' },
  { slug: 'compare', title: 'Compare', description: 'Pick the right provider' },
  { slug: 'deployment', title: 'Deployment', description: 'Ship your stack to production' },
];

const bestPracticeLinks = [
  { slug: 'databases', title: 'Choose the right database', description: 'SQL, NoSQL, vector and real-time' },
  { slug: 'authentication', title: 'Set up authentication early', description: 'Avoid painful migrations later' },
  { slug: 'cloud', title: 'Start with managed services', description: 'Move faster with less ops' },
];

export default function DocsPage() {
  const jsonLd = breadcrumbSchema([{ name: 'Docs', url: '/docs' }]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="mx-auto max-w-3xl">
        <header className="text-center">
          <p className="text-sm font-medium text-violet-400">Documentation</p>
          <h1 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-5xl">
            Build smarter with <span className="gradient-text">Stack2Set</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">
            Everything you need to discover, compare, and assemble the perfect technology stack.
          </p>
        </header>

        <section className="mt-16">
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            <Sparkles className="h-4 w-4 text-violet-400" />
            Popular topics
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {docGroups[0].items.map((item) => (
              <Link
                key={item.slug}
                href={`/docs/${item.slug}`}
                className="group glass glass-hover rounded-2xl p-5 transition-all hover:-translate-y-0.5"
              >
                <BookOpen className="h-5 w-5 text-violet-400" />
                <h3 className="mt-3 text-sm font-semibold text-foreground">{item.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-violet-400 opacity-0 transition-opacity group-hover:opacity-100">
                  Read guide <ArrowRight className="h-3 w-3" />
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-16">
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            <Terminal className="h-4 w-4 text-violet-400" />
            Quick start
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Get from idea to a full technology stack in under a minute. No account, no setup, no
            credit card.
          </p>
          <CodeBlock code={quickStartCode} language="bash" />
        </section>

        <section className="mt-16">
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            <ListChecks className="h-4 w-4 text-violet-400" />
            Categories
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Browse recommended providers for each technology category.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/category?id=${cat.id}&name=${encodeURIComponent(cat.name)}`}
                className="glass glass-hover flex items-center gap-3 rounded-xl p-3.5 transition-all hover:-translate-y-0.5"
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${cat.gradient}`}
                >
                  <cat.icon className={`h-4.5 w-4.5 ${cat.iconColor}`} />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-foreground">
                    {cat.name}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {cat.providers} providers
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-16">
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            <GitCompare className="h-4 w-4 text-violet-400" />
            API reference
          </h2>
          <div className="mt-4 flex items-center justify-between gap-4 rounded-2xl glass p-6">
            <div>
              <h3 className="text-base font-semibold text-foreground">Analyze endpoint</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Send a project description and get a ranked technology stack back.
              </p>
            </div>
            <Link
              href="/docs/api"
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-blue-500 px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
            >
              View reference <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-4 rounded-2xl border border-foreground/5 bg-foreground/[0.02] p-6">
            <p className="text-sm text-muted-foreground">
              Compare providers on any category page — ranked by fit, with best use cases, free
              tiers, and open-source indicators.
            </p>
          </div>
        </section>

        <section className="mt-16">
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            <GraduationCap className="h-4 w-4 text-violet-400" />
            Tutorials
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {tutorialLinks.map((link) => (
              <Link
                key={link.slug}
                href={`/docs/${link.slug}`}
                className="group flex items-start gap-3 rounded-2xl glass p-4 transition-all hover:-translate-y-0.5"
              >
                <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-violet-400" />
                <span>
                  <span className="block text-sm font-semibold text-foreground group-hover:text-violet-400">
                    {link.title}
                  </span>
                  <span className="block text-xs text-muted-foreground">{link.description}</span>
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-16">
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            <Lightbulb className="h-4 w-4 text-violet-400" />
            Best practices
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {bestPracticeLinks.map((link) => (
              <Link
                key={link.slug}
                href={`/docs/${link.slug}`}
                className="group flex items-start gap-3 rounded-2xl glass p-4 transition-all hover:-translate-y-0.5"
              >
                <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                <span>
                  <span className="block text-sm font-semibold text-foreground group-hover:text-amber-400">
                    {link.title}
                  </span>
                  <span className="block text-xs text-muted-foreground">{link.description}</span>
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-16 grid gap-3 sm:grid-cols-2">
          <Link
            href="/changelog"
            className="flex items-center justify-between rounded-2xl glass p-5 transition-all hover:-translate-y-0.5"
          >
            <span className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-violet-400" />
              <span>
                <span className="block text-sm font-semibold text-foreground">Changelog</span>
                <span className="block text-xs text-muted-foreground">See what&apos;s new</span>
              </span>
            </span>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </Link>
          <Link
            href="/faq"
            className="flex items-center justify-between rounded-2xl glass p-5 transition-all hover:-translate-y-0.5"
          >
            <span className="flex items-center gap-3">
              <HelpCircle className="h-5 w-5 text-violet-400" />
              <span>
                <span className="block text-sm font-semibold text-foreground">FAQ</span>
                <span className="block text-xs text-muted-foreground">Frequently asked questions</span>
              </span>
            </span>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </Link>
        </section>
      </div>
    </>
  );
}
