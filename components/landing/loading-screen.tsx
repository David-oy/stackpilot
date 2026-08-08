'use client';

import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { categoryCssVars, getCategoryMeta } from '@/lib/categories';
import { CanvasParticles } from '@/components/ui/canvas-particles';

const phases = [
  'Understanding your project idea',
  'Checking our provider database',
  'Ranking the best-fit providers',
  'Assembling your stack',
];

const NODES = ['frontend', 'backend', 'database', 'authentication', 'payments'];

const PARTICLE_COLORS = [
  'rgba(34, 211, 238, 0.7)',
  'rgba(99, 102, 241, 0.7)',
  'rgba(168, 85, 247, 0.7)',
  'rgba(244, 114, 182, 0.7)',
  'rgba(52, 211, 153, 0.7)',
];

export function LoadingScreen({ query }: { query: string }) {
  const reduceMotion = useReducedMotion();
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    if (reduceMotion) {
      setProgress(100);
      setPhase(phases.length - 1);
      return;
    }
    const interval = setInterval(() => {
      setProgress((p) => (p >= 100 ? 0 : p + 1));
    }, 160);
    return () => clearInterval(interval);
  }, [reduceMotion]);

  useEffect(() => {
    if (reduceMotion) return;
    const timer = setInterval(() => setPhase((p) => (p + 1) % phases.length), 5200);
    return () => clearInterval(timer);
  }, [reduceMotion]);

  const litCount = Math.min(NODES.length, Math.floor((progress / 100) * NODES.length));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-background">
      <CanvasParticles
        colors={PARTICLE_COLORS}
        speed={0.8}
        className="absolute inset-0 h-full w-full opacity-50"
      />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[680px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-teal-500/12 blur-[130px]" />

      <div className="w-full max-w-md px-6">
        <div className="mb-10 flex flex-col items-center">
          <div className="relative mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-500">
            <motion.div
              animate={reduceMotion ? undefined : { scale: [1, 1.15, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 rounded-2xl bg-teal-500 blur-md opacity-60"
            />
            <Sparkles className="relative h-8 w-8 text-white" />
          </div>
          <h2 className="text-xl font-semibold text-foreground">Analyzing your project</h2>
          <p className="mt-1 max-w-sm truncate text-sm text-muted-foreground">
            {query ? `"${query}"` : 'Your idea'}
          </p>
        </div>

        {/* Emerging category nodes */}
        <div className="mb-8 flex items-center justify-center gap-2">
          {NODES.map((id, index) => {
            const meta = getCategoryMeta(id);
            const Icon = meta.icon;
            const lit = index < litCount;
            return (
              <motion.span
                key={id}
                initial={reduceMotion ? false : { opacity: 0, scale: 0.4 }}
                animate={{ opacity: lit ? 1 : 0.18, scale: lit ? 1 : 0.8 }}
                transition={{ duration: 0.35 }}
                style={categoryCssVars(meta.color)}
                aria-hidden="true"
                className={`flex h-10 w-10 items-center justify-center rounded-xl ring-1 transition-shadow ${
                  lit ? 'cat-icon-box cat-glow-sm ring-foreground/10' : 'bg-foreground/[0.03] ring-foreground/10'
                }`}
              >
                <Icon className={`h-4.5 w-4.5 ${meta.color.text}`} />
              </motion.span>
            );
          })}
        </div>

        <div className="space-y-3">
          {phases.map((label, i) => (
            <div
              key={label}
              className={`flex items-center gap-3 transition-colors ${
                reduceMotion || i <= phase ? 'text-foreground' : 'text-muted-foreground/40'
              }`}
            >
              {reduceMotion ? (
                <span className="h-2 w-2 rounded-full bg-teal-400" />
              ) : i === phase ? (
                <motion.span className="h-2 w-2 rounded-full bg-teal-400 shadow-[0_0_10px_rgba(45,212,191,0.9)]" />
              ) : (
                <span className="h-2 w-2 rounded-full bg-foreground/15" />
              )}
              <span className="text-sm">{label}</span>
            </div>
          ))}
        </div>

        <div className="mt-8 h-1 w-full overflow-hidden rounded-full bg-foreground/5">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400"
            style={{ width: `${progress}%` }}
            transition={{ duration: 0.2, ease: 'linear' }}
          />
        </div>
        <p className="mt-3 text-center text-xs text-muted-foreground">
          This usually takes under a minute.
        </p>
      </div>
    </div>
  );
}
