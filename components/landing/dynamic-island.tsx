'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Check, Cloud, Loader2, Play, Sparkles } from 'lucide-react';
import { DemoModal } from './demo-modal';
import { useAuth } from '@/lib/auth/auth-context';
import { subscribeIslandPhase, type IslandPhase } from '@/lib/island-store';

/**
 * Floating bottom action island (Dynamic Island inspired).
 *
 * One canonical island with a single state machine (see lib/island-store):
 * - `cta` (landing page, signed-out users): the IDLE state — a single
 *   "✦ Get the Stack" pill that expands on hover/tap to show "View Demo".
 *   Uses a dark translucent surface, blur, a soft shadow and a slowly
 *   shifting multi-color glow.
 * - `status` (search / workspace): mirrors the analysis phase — spinners
 *   while the stack is being understood, ranked and assembled, a checkmark
 *   when it's complete, and a cloud mark once it's saved.
 *
 * Only one variant is ever mounted, so there is never a competing island.
 */
export function DynamicIsland({
  variant = 'cta',
}: {
  variant?: 'cta' | 'status';
}) {
  const { user, loading } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);
  const [phase, setPhase] = useState<IslandPhase>('idle');
  const reduceMotion = useReducedMotion();
  const islandRef = useRef<HTMLDivElement>(null);

  useEffect(() => subscribeIslandPhase(setPhase), []);

  useEffect(() => {
    if (!expanded) return;
    const onPointerDown = (event: PointerEvent) => {
      if (islandRef.current && !islandRef.current.contains(event.target as Node)) {
        setExpanded(false);
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [expanded]);

  const focusSearch = () => {
    const input = document.getElementById('hero-search') as HTMLInputElement | null;
    if (input) {
      if (window.__lenis) {
        window.__lenis.scrollTo(input, { offset: -80, duration: 1.2 });
        requestAnimationFrame(() => input.focus({ preventScroll: true }));
      } else {
        input.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
        input.focus({ preventScroll: true });
      }
    }
    setExpanded(false);
  };

  const actionButtonClass =
    'inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-medium transition-colors sm:px-5 sm:py-2.5 sm:text-sm';

  if (variant === 'status') {
    return <StatusIsland phase={phase} />;
  }

  if (user || loading) return null;

  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 bottom-[max(1.25rem,env(safe-area-inset-bottom))] z-50 flex justify-center px-4 sm:bottom-[max(1.75rem,env(safe-area-inset-bottom))]">
        <motion.div
          ref={islandRef}
          layout={!reduceMotion}
          onClick={() => setExpanded((value) => !value)}
          onMouseEnter={() => setExpanded(true)}
          onMouseLeave={() => setExpanded(false)}
          role="group"
          aria-label="Actions"
          className="island-glow pointer-events-auto flex w-fit max-w-full items-center gap-1 rounded-full border border-white/10 bg-black/60 p-1 pl-2 shadow-[0_18px_50px_rgba(0,0,0,0.6)] backdrop-blur-xl sm:p-1.5 sm:pl-3"
        >
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              focusSearch();
            }}
            className={`${actionButtonClass} bg-white text-black hover:bg-white/90`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Get the Stack</span>
          </button>

          <AnimatePresence initial={false}>
            {expanded && (
              <motion.div
                initial={reduceMotion ? false : { width: 0, opacity: 0 }}
                animate={{ width: 'auto', opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="flex items-center gap-1 overflow-hidden"
              >
                <span aria-hidden="true" className="h-5 w-px bg-white/15" />
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setDemoOpen(true);
                    setExpanded(false);
                  }}
                  className={`${actionButtonClass} text-white/85 hover:text-white`}
                >
                  <Play className="h-3.5 w-3.5" />
                  <span>View Demo</span>
                </button>
                <span aria-hidden="true" className="hidden pr-1 text-white/40 sm:block">
                  <ArrowRight className="h-4 w-4" />
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      <DemoModal open={demoOpen} onOpenChange={setDemoOpen} onGetStack={focusSearch} />
    </>
  );
}

const STATUS_CONTENT: Record<Exclude<IslandPhase, 'idle'>, { label: string; busy: boolean }> = {
  analyzing: { label: 'Analyzing your idea\u2026', busy: true },
  understanding: { label: 'Understanding your project idea\u2026', busy: true },
  database: { label: 'Checking our provider database\u2026', busy: true },
  providers: { label: 'Ranking the best-fit providers\u2026', busy: true },
  assembling: { label: 'Gathering your stack\u2026', busy: true },
  complete: { label: 'Your Stack is ready', busy: false },
  saved: { label: 'Saved to cloud', busy: false },
};

const TERMINAL_PHASES: IslandPhase[] = ['complete', 'saved'];

function StatusIsland({ phase }: { phase: IslandPhase }) {
  const reduceMotion = useReducedMotion();
  const [visible, setVisible] = useState(phase !== 'idle');

  useEffect(() => {
    setVisible(phase !== 'idle');
  }, [phase]);

  useEffect(() => {
    if (!TERMINAL_PHASES.includes(phase)) return;
    const timer = setTimeout(() => setVisible(false), 4000);
    return () => clearTimeout(timer);
  }, [phase]);

  const content = phase === 'idle' ? null : STATUS_CONTENT[phase];

  return (
    <AnimatePresence>
      {visible && content && (
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 16, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.9 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="pointer-events-none fixed inset-x-0 bottom-[max(1.25rem,env(safe-area-inset-bottom))] z-50 flex justify-center px-4 sm:bottom-[max(1.75rem,env(safe-area-inset-bottom))]"
        >
          <div className="island-glow pointer-events-auto flex min-w-0 w-fit max-w-full items-center gap-2 rounded-full border border-white/10 bg-black/70 py-2.5 pl-3 pr-4 shadow-[0_18px_50px_rgba(0,0,0,0.6)] backdrop-blur-xl sm:py-3 sm:pl-3.5 sm:pr-5">
            {content.busy ? (
              <Loader2 className="h-4 w-4 shrink-0 animate-spin text-teal-300" />
            ) : phase === 'saved' ? (
              <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500/20">
                <Cloud className="h-3 w-3 text-emerald-400" />
              </span>
            ) : (
              <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500/20">
                <Check className="h-3 w-3 text-emerald-400" />
              </span>
            )}
            <span className="truncate text-sm font-medium text-white">{content.label}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
