import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, CalendarDays, Clock } from 'lucide-react';
import { Navbar } from '@/components/landing/navbar';
import { Footer } from '@/components/landing/footer';

export const metadata: Metadata = {
  title: 'Blog',
  description:
    'Guides and insights on building technology stacks: choosing databases, auth, cloud providers, and shipping to production.',
  alternates: { canonical: '/blog' },
};

const posts = [
  {
    title: 'How to choose the right database for your app',
    date: 'August 2026',
    readTime: '6 min',
    excerpt:
      'Relational, document, vector, or real-time? A practical framework for picking a database you won’t regret.',
    href: '/docs/databases',
    tag: 'Databases',
  },
  {
    title: 'Authentication, without the headache',
    date: 'July 2026',
    readTime: '5 min',
    excerpt:
      'Hosted auth, OAuth, magic links, and session management — and why you shouldn’t build your own.',
    href: '/docs/authentication',
    tag: 'Authentication',
  },
  {
    title: 'From idea to deployed app with Stack2Set',
    date: 'July 2026',
    readTime: '4 min',
    excerpt:
      'A step-by-step walkthrough of taking a project idea to a deployed stack using Stack2Set.',
    href: '/docs/getting-started',
    tag: 'Tutorial',
  },
  {
    title: 'Managed cloud vs. self-hosted: what actually matters',
    date: 'June 2026',
    readTime: '7 min',
    excerpt:
      'Speed, cost, control, and compliance — how to decide where your app should run.',
    href: '/docs/cloud',
    tag: 'Cloud',
  },
  {
    title: 'Shipping your first deployment: a checklist',
    date: 'May 2026',
    readTime: '5 min',
    excerpt:
      'Preview deployments, environment variables, custom domains, and monitoring — everything before you hit publish.',
    href: '/docs/deployment',
    tag: 'Deployment',
  },
];

export default function BlogPage() {
  return (
    <main className="relative min-h-screen overflow-x-hidden">
      <Navbar />
      <div className="relative overflow-hidden px-4 pb-24 pt-32 sm:px-6 sm:pt-36">
        <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[400px] w-[700px] -translate-x-1/2 rounded-full bg-teal-500/10 blur-[120px]" />

        <header className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-medium text-teal-400">Blog</p>
          <h1 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-5xl">
            Build better <span className="gradient-text">stacks</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Guides and insights on choosing databases, auth, cloud providers, and shipping to
            production.
          </p>
        </header>

        <div className="mx-auto mt-16 max-w-3xl space-y-4">
          {posts.map((post) => (
            <Link
              key={post.title}
              href={post.href}
              className="group block glass glass-hover rounded-2xl p-6 transition-all hover:-translate-y-1"
            >
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="rounded-full bg-teal-500/10 px-2.5 py-0.5 font-medium text-teal-400">
                  {post.tag}
                </span>
                <span className="inline-flex items-center gap-1">
                  <CalendarDays className="h-3 w-3" />
                  {post.date}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {post.readTime}
                </span>
              </div>
              <h2 className="mt-3 text-lg font-semibold text-foreground transition-colors group-hover:text-teal-400">
                {post.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{post.excerpt}</p>
              <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-teal-400">
                Read guide <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>
      </div>
      <Footer />
    </main>
  );
}
