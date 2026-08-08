'use client';

import { useRef, type PointerEvent as ReactPointerEvent } from 'react';
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { SearchBar } from '@/components/search/search-bar';
import { AuthModal } from '@/components/auth/auth-modal';
import { StackPreview } from '@/components/landing/stack-preview';
import { CanvasParticles } from '@/components/ui/canvas-particles';
import { useProjectSearch } from '@/hooks/use-project-search';

const popularSearches = [
  'YouTube',
  'Spotify',
  'Netflix',
  'Instagram',
  'Uber',
  'Discord',
  'AI Chatbot',
];

const PARTICLE_COLORS = [
  'rgba(34, 211, 238, 0.7)',
  'rgba(99, 102, 241, 0.7)',
  'rgba(168, 85, 247, 0.7)',
  'rgba(244, 114, 182, 0.7)',
  'rgba(52, 211, 153, 0.7)',
];

export function Hero() {
  const { handleSearch, authOpen, setAuthOpen, attemptedQuery } = useProjectSearch();
  const reduceMotion = useReducedMotion();

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const springX = useSpring(mx, { stiffness: 40, damping: 20 });
  const springY = useSpring(my, { stiffness: 40, damping: 20 });
  const blobX = useTransform(springX, (v) => v * -22);
  const blobY = useTransform(springY, (v) => v * -14);

  const onPointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    mx.set((event.clientX - rect.left) / rect.width - 0.5);
    my.set((event.clientY - rect.top) / rect.height - 0.5);
  };

  return (
    <section
      id="hero"
      onPointerMove={onPointerMove}
      className="relative flex min-h-svh flex-col justify-center overflow-hidden pb-24 pt-28 sm:pb-32 sm:pt-32"
    >
      {/* Generative technology backdrop */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <CanvasParticles colors={PARTICLE_COLORS} className="h-full w-full opacity-70" />
        <motion.div
          style={reduceMotion ? undefined : { x: blobX, y: blobY }}
          className="animate-aurora absolute left-1/2 top-0 h-[540px] w-[820px] -translate-x-1/2 rounded-full bg-purple-500/12 blur-[130px]"
        />
        <motion.div
          style={reduceMotion ? undefined : { x: blobX, y: blobY }}
          className="animate-aurora absolute right-[-8%] top-44 h-[420px] w-[420px] rounded-full bg-cyan-500/11 blur-[110px]"
        />
        <div className="animate-aurora absolute -left-24 bottom-0 h-[320px] w-[320px] rounded-full bg-emerald-500/10 blur-[100px]" />
      </div>

      <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
        <div className="mb-7 inline-flex animate-fade-up items-center gap-2 rounded-full glass px-4 py-1.5 text-xs font-medium tracking-wide text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-teal-400" />
          <span>AI-powered tech stack discovery</span>
        </div>

        <h1
          className="animate-fade-up text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-6xl md:text-7xl"
          style={{ animationDelay: '0.05s' }}
        >
          What do you want to <span className="gradient-text">build?</span>
        </h1>

        <p
          className="mx-auto mt-6 max-w-2xl animate-fade-up text-balance text-base leading-relaxed text-muted-foreground sm:text-lg"
          style={{ animationDelay: '0.1s' }}
        >
          Describe what you&apos;re building. Stack2Set identifies the technologies and providers
          you need, then helps you build your stack.
        </p>

        <div className="relative mx-auto mt-10 max-w-2xl animate-fade-up" style={{ animationDelay: '0.15s' }}>
          <div
            aria-hidden="true"
            className="animate-pulse-glow pointer-events-none absolute -inset-8 -z-10 rounded-full bg-gradient-to-r from-purple-500/10 via-cyan-500/10 to-emerald-500/10 blur-2xl"
          />
          <SearchBar
            onSearch={handleSearch}
            placeholder="Describe what you're building..."
            inputId="hero-search"
          />

          <div className="mt-7 flex flex-wrap items-center justify-center gap-2">
            <span className="text-xs text-muted-foreground">Popular:</span>
            {popularSearches.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => handleSearch(`I want to build ${item}`)}
                className="rounded-full glass glass-hover px-3 py-1.5 text-xs text-muted-foreground transition-all hover:text-foreground"
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <StackPreview />
      </div>

      <AuthModal open={authOpen} onOpenChange={setAuthOpen} query={attemptedQuery} />
    </section>
  );
}
