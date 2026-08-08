'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Play, Sparkles } from 'lucide-react';
import { DemoModal } from './demo-modal';
import { useAuth } from '@/lib/auth/auth-context';

/**
 * Floating bottom action island (Dynamic Island inspired).
 * Collapsed → a single "✦ Get the Stack" pill. Hover/tap expands to show the
 * two primary actions. Uses a dark translucent surface, blur, a soft shadow and
 * a slowly shifting category-colored glow. Only shown to signed-out users.
 */
export function DynamicIsland() {
  const { user, loading } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);
  const reduceMotion = useReducedMotion();
  const islandRef = useRef<HTMLDivElement>(null);

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
      input.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
      input.focus({ preventScroll: true });
    }
    setExpanded(false);
  };

  const actionButtonClass =
    'inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-medium transition-colors sm:px-5 sm:py-2.5 sm:text-sm';

  if (user || loading) return null;

  return (
    <>
      <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 sm:bottom-7">
        <motion.div
          ref={islandRef}
          layout={!reduceMotion}
          onClick={() => setExpanded((value) => !value)}
          onMouseEnter={() => setExpanded(true)}
          onMouseLeave={() => setExpanded(false)}
          role="group"
          aria-label="Actions"
          className="island-glow flex items-center gap-1 rounded-full border border-white/10 bg-black/60 p-1 pl-2 shadow-[0_18px_50px_rgba(0,0,0,0.6)] backdrop-blur-xl sm:p-1.5 sm:pl-3"
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
