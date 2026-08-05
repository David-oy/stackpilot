import { ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function CTA() {
  return (
    <section id="cta" className="relative py-24">
      <div className="mx-auto max-w-5xl px-6">
        <div className="relative overflow-hidden rounded-3xl gradient-border p-12 text-center sm:p-16">
          <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[300px] w-[500px] -translate-x-1/2 rounded-full bg-violet-600/20 blur-[100px]" />
          <div className="pointer-events-none absolute bottom-0 right-0 -z-10 h-[200px] w-[300px] rounded-full bg-blue-600/15 blur-[80px]" />

          <div className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-xs text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-violet-400" />
            <span>Start building for free</span>
          </div>

          <h2 className="mt-6 text-balance text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            Start Planning Your <span className="gradient-text">Next Project</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            Join thousands of developers using StackPilot to discover and assemble the perfect tech stack.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button className="h-12 bg-gradient-to-r from-violet-500 to-blue-500 px-8 text-base text-white hover:from-violet-600 hover:to-blue-600">
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button variant="outline" className="h-12 border-white/10 bg-transparent px-8 text-base text-white hover:bg-white/5">
              View Demo
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
