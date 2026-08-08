'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { categoryCssVars, getCategoryMeta } from '@/lib/categories';

const LAYERS = [
  { id: 'frontend', providers: ['React', 'Next.js'] },
  { id: 'backend', providers: ['Node.js', 'Supabase'] },
  { id: 'database', providers: ['PostgreSQL'] },
  { id: 'authentication', providers: ['Clerk'] },
  { id: 'payments', providers: ['Stripe'] },
];

/**
 * Colorful "stack being assembled" preview for the landing hero.
 * Each layer uses its category's centralized color and overlaps the next one
 * slightly, communicating depth without heavy 3D.
 */
export function StackPreview() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="relative mx-auto mt-16 w-full max-w-3xl" aria-hidden="true">
      {/* Ambient glow behind the stack */}
      <div className="pointer-events-none absolute inset-0 -z-10 blur-3xl">
        <div className="absolute left-8 top-6 h-40 w-40 rounded-full bg-purple-500/15" />
        <div className="absolute right-8 top-1/2 h-40 w-40 rounded-full bg-cyan-500/12" />
        <div className="absolute bottom-0 left-1/2 h-32 w-48 -translate-x-1/2 rounded-full bg-emerald-500/10" />
      </div>

      <div className="mb-5 flex items-center justify-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-teal-400" />
        <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-muted-foreground">
          Your Stack
        </p>
      </div>

      <ol className="flex flex-col items-center" style={{ perspective: '1200px' }}>
        {LAYERS.map((layer, index) => {
          const meta = getCategoryMeta(layer.id);
          const Icon = meta.icon;
          const offset = index % 2 === 0 ? 1 : -1;
          return (
            <motion.li
              key={layer.id}
              initial={reduceMotion ? false : { opacity: 0, y: 26, rotateX: -8 }}
              whileInView={
                reduceMotion
                  ? undefined
                  : { opacity: 1, y: 0, rotateX: 0 }
              }
              viewport={{ once: true, margin: '-40px' }}
              transition={{
                duration: 0.55,
                delay: index * 0.08,
                ease: [0.22, 1, 0.36, 1],
              }}
              style={categoryCssVars(meta.color)}
              className="w-full px-3 sm:px-0 sm:w-[88%]"
            >
              <div
                className={`cat-hover-glow relative rounded-2xl border border-foreground/10 bg-[#0b0b14]/90 px-5 py-3.5 shadow-xl shadow-black/30 sm:px-6 ${
                  index === 0 ? '' : '-mt-3 sm:-mt-3.5'
                } ${
                  offset === 1
                    ? 'sm:mr-[9%] sm:rotate-[1.1deg]'
                    : 'sm:ml-[9%] sm:rotate-[-1.1deg]'
                }`}
              >
                <span
                  aria-hidden="true"
                  className="cat-top-line absolute inset-x-4 top-0 h-px"
                />
                <div className="flex items-center gap-3">
                  <span className="cat-icon-box cat-glow-sm flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1 ring-foreground/10">
                    <Icon className={`h-4.5 w-4.5 ${meta.color.text}`} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-foreground">
                      {meta.name}
                    </span>
                  </span>
                  <span className="flex flex-wrap items-center justify-end gap-1.5">
                    {layer.providers.map((provider) => (
                      <span
                        key={provider}
                        className="cat-border rounded-md border bg-foreground/[0.03] px-2 py-0.5 text-[10px] font-medium text-foreground/80"
                      >
                        {provider}
                      </span>
                    ))}
                  </span>
                </div>
              </div>
            </motion.li>
          );
        })}
      </ol>
    </div>
  );
}
