import Link from 'next/link';
import { ArrowRight, BookOpen } from 'lucide-react';
import { docGroups } from '@/lib/docs';

const topics = docGroups.flatMap((group) => group.items).slice(0, 6);

export function DocsSection() {
  return (
    <section id="docs" className="relative py-24 sm:py-28">
      <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[500px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-700/10 blur-[140px]" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium text-violet-400">Documentation</p>
          <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-5xl">
            Learn to build with <span className="gradient-text">StackPilot</span>
          </h2>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">
            Guides for discovering, comparing, and assembling the perfect technology stack.
          </p>
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {topics.map((topic) => (
            <Link
              key={topic.slug}
              href={`/docs/${topic.slug}`}
              className="group glass glass-hover rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1"
            >
              <div className="flex items-start justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 ring-1 ring-violet-500/20">
                  <BookOpen className="h-5 w-5 text-violet-400" />
                </span>
                <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
              <h3 className="mt-4 text-sm font-semibold text-foreground group-hover:text-violet-400">
                {topic.title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {topic.description}
              </p>
            </Link>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/docs"
            className="inline-flex items-center gap-2 rounded-full glass glass-hover px-6 py-2.5 text-sm font-medium text-foreground transition-colors hover:text-violet-400"
          >
            Browse all documentation
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
