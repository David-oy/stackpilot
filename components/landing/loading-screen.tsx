'use client';

import { Sparkles, Loader2 } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';

const phases = [
  'Understanding your project idea',
  'Checking our provider database',
  'Ranking the best-fit providers',
  'Assembling your stack',
];

export function LoadingScreen({ query }: { query: string }) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
      <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-teal-500/15 blur-[120px]" />

      <div className="w-full max-w-md px-6">
        <motion.div
          initial={reduceMotion ? false : { scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="mb-10 flex flex-col items-center"
        >
          <div className="relative mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-500">
            <motion.div
              animate={reduceMotion ? undefined : { scale: [1, 1.15, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 rounded-2xl bg-teal-500 blur-md opacity-60"
            />
            <Sparkles className="relative h-8 w-8 text-white" />
          </div>
          <h2 className="text-xl font-semibold text-foreground">Analyzing your project</h2>
          <p className="mt-1 text-sm text-muted-foreground">{query ? `"${query}"` : 'Your idea'}</p>
        </motion.div>

        <div className="space-y-3">
          {phases.map((phase, i) => {
            const isActive = i === 0;
            return (
              <div
                key={phase}
                className={`flex items-center gap-3 transition-colors ${
                  isActive ? 'text-foreground' : 'text-muted-foreground/50'
                }`}
              >
                {isActive ? (
                  <Loader2 className="h-5 w-5 shrink-0 animate-spin text-teal-400" />
                ) : (
                  <div className="h-2 w-2 shrink-0 rounded-full bg-foreground/15" />
                )}
                <span className="text-sm">{phase}</span>
              </div>
            );
          })}
        </div>

        <div className="mt-8 h-1 w-full overflow-hidden rounded-full bg-foreground/5">
          <motion.div
            initial={false}
            animate={reduceMotion ? { x: 0 } : { x: ['-100%', '300%'] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            className="h-full w-1/3 rounded-full bg-gradient-to-r from-transparent via-teal-500 to-transparent"
          />
        </div>
        <p className="mt-3 text-center text-xs text-muted-foreground">
          This usually takes under a minute.
        </p>
      </div>
    </div>
  );
}
