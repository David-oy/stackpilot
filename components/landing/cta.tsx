import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Reveal } from '@/components/ui/reveal';

export function CTA() {
  return (
    <section id="cta" className="relative py-24 sm:py-28">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl gradient-border p-12 text-center sm:p-16">
            <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[300px] w-[500px] -translate-x-1/2 rounded-full bg-violet-600/20 blur-[100px]" />
            <div className="pointer-events-none absolute bottom-0 right-0 -z-10 h-[200px] w-[300px] rounded-full bg-blue-600/15 blur-[80px]" />

            <div className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-xs text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-violet-400" />
              <span>Start building for free</span>
            </div>

            <h2 className="mt-6 text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-5xl">
              Start Planning Your <span className="gradient-text">Next Project</span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Join thousands of developers using StackPilot to discover and assemble the perfect
              tech stack.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button
                asChild
                className="h-12 rounded-xl bg-gradient-to-r from-violet-500 to-blue-500 px-8 text-base text-white shadow-lg shadow-violet-500/25 transition-all hover:from-violet-600 hover:to-blue-600 hover:shadow-violet-500/40"
              >
                <Link href="/">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-12 rounded-xl border-foreground/10 bg-transparent px-8 text-base text-foreground hover:bg-foreground/5"
              >
                <Link href="/docs/getting-started">View Demo</Link>
              </Button>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
