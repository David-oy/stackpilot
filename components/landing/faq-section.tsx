import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { FaqAccordion } from '@/components/landing/faq-accordion';
import { featuredFaqItems } from '@/lib/faq';

export function FaqSection() {
  return (
    <section id="faq" className="relative py-24 sm:py-28">
      <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[500px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-700/10 blur-[140px]" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium text-violet-400">FAQ</p>
          <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-5xl">
            Frequently asked <span className="gradient-text">questions</span>
          </h2>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">
            Quick answers about StackPilot, recommendations, and building your stack.
          </p>
        </div>

        <div className="mt-14">
          <FaqAccordion items={featuredFaqItems} showFilters={false} />
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/faq"
            className="inline-flex items-center gap-2 rounded-full glass glass-hover px-6 py-2.5 text-sm font-medium text-foreground transition-colors hover:text-violet-400"
          >
            Browse all questions
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
