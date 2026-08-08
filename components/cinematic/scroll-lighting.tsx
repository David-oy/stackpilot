'use client';

import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from 'framer-motion';
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { categoryCssVars } from '@/lib/categories';

/**
 * Cinematic scroll-lighting system.
 *
 * Three signature moments:
 *  1. Hero generative field          (see components/cinematic/hero-field.tsx)
 *  2. Scroll lighting (this file)    — one continuous dark→light reveal across the page
 *  3. Stack assembly animation       (see components/workspace/stack-editor.tsx)
 *
 * `LightReveal` fades content out of darkness as it enters the viewport. It is a
 * *section-level* effect — use it on whole blocks, never on every small card.
 * `ScrollLightField` is a fixed, scroll-driven travelling light. `SectionGlow`
 * adds localized category-colored light to an individual section.
 */

export const GLOW_COLORS: Record<string, string> = {
  purple: '192,132,252',
  violet: '167,139,250',
  indigo: '129,140,248',
  blue: '96,165,250',
  sky: '56,189,248',
  cyan: '34,211,238',
  teal: '45,212,191',
  emerald: '52,211,153',
  green: '74,222,128',
  amber: '251,191,36',
  orange: '251,146,60',
  yellow: '250,204,21',
  pink: '244,114,182',
  rose: '251,113,133',
  fuchsia: '232,121,249',
  red: '248,113,113',
  slate: '148,163,184',
};

function glowRgb(glow: string | keyof typeof GLOW_COLORS): string {
  if (glow.includes(',')) return glow;
  return GLOW_COLORS[glow] ?? GLOW_COLORS.cyan;
}

/** Pause list: returns true while the tab is hidden. */
export function usePauseWhenHidden(): boolean {
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    const onVisibility = () => {
      const isHidden = document.hidden;
      setHidden(isHidden);
      document.documentElement.toggleAttribute('data-page-hidden', isHidden);
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      document.documentElement.removeAttribute('data-page-hidden');
    };
  }, []);
  return hidden;
}

/**
 * Section-level reveal: content starts mostly dark and is progressively lit as
 * the block scrolls into view. Prefers a continuous light over per-card fades.
 */
export function LightReveal({
  children,
  className,
  darkness = 0.22,
  distance = 26,
}: {
  children: ReactNode;
  className?: string;
  /** Brightness at the very start of the reveal (0..1). */
  darkness?: number;
  /** Vertical travel (px) while emerging. */
  distance?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start 0.92', 'start 0.45'],
  });
  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [0, 0.45, 1]);
  const y = useTransform(scrollYProgress, [0, 1], [distance, 0]);
  const filter = useTransform(
    scrollYProgress,
    [0, 1],
    [`brightness(${darkness}) blur(5px)`, 'brightness(1) blur(0px)'],
  );

  return (
    <motion.div ref={ref} className={className} style={reduceMotion ? undefined : { opacity, y, filter }}>
      {children}
    </motion.div>
  );
}

const LIGHT_BLOBS = [
  { size: 760, color: 'rgba(34,211,238,0.10)', x: [0.12, 0.82], y: [0.06, 0.72] },
  { size: 640, color: 'rgba(168,85,247,0.10)', x: [0.82, 0.2], y: [0.3, 0.82] },
  { size: 560, color: 'rgba(52,211,153,0.08)', x: [0.5, 0.1], y: [0.78, 0.2] },
  { size: 480, color: 'rgba(244,114,182,0.07)', x: [0.2, 0.72], y: [0.55, 0.15] },
];

function LightBlob({
  progress,
  size,
  color,
  xRange,
  yRange,
}: {
  progress: MotionValue<number>;
  size: number;
  color: string;
  xRange: [number, number];
  yRange: [number, number];
}) {
  const x = useTransform(progress, [0, 1], [`${xRange[0] * 100}%`, `${xRange[1] * 100}%`]);
  const y = useTransform(progress, [0, 1], [`${yRange[0] * 100}%`, `${yRange[1] * 100}%`]);
  return (
    <motion.div
      className="absolute rounded-full animate-light-drift"
      style={{
        width: size,
        height: size,
        left: x,
        top: y,
        x: '-50%',
        y: '-50%',
        background: `radial-gradient(circle, ${color} 0%, transparent 68%)`,
        willChange: 'transform, left, top',
      }}
    />
  );
}

/**
 * Fixed, full-viewport layer of soft light that travels slowly through the page
 * as the user scrolls — the signature "the stack emerges from darkness" light.
 */
export function ScrollLightField() {
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const smooth = useSpring(scrollYProgress, { stiffness: 60, damping: 22, mass: 0.6 });

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-20 overflow-hidden"
      data-cinematic-field
    >
      {reduceMotion
        ? null
        : LIGHT_BLOBS.map((blob, index) => (
            <LightBlob
              key={index}
              progress={smooth}
              size={blob.size}
              color={blob.color}
              xRange={blob.x as [number, number]}
              yRange={blob.y as [number, number]}
            />
          ))}
    </div>
  );
}

/**
 * Localized category-colored light for a section (glows behind the section
 * while it is on screen, driven by that section's own scroll progress).
 */
export function SectionGlow({
  glow = 'cyan',
  size = 640,
  peak = 0.16,
  className,
}: {
  glow?: string;
  size?: number;
  /** Max opacity of the glow when the section is centered. */
  peak?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.9', 'end 0.1'] });
  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [0, peak, 0]);
  const rgb = glowRgb(glow);

  return (
    <motion.div
      ref={ref}
      aria-hidden="true"
      className={`pointer-events-none absolute left-1/2 top-1/2 -z-10 -translate-x-1/2 -translate-y-1/2 rounded-full ${className ?? ''}`}
      style={{
        width: size,
        height: size,
        opacity: reduceMotion ? peak : opacity,
        background: `radial-gradient(circle, rgba(${rgb}, 0.85) 0%, rgba(${rgb}, 0.18) 45%, transparent 70%)`,
        filter: 'blur(70px)',
      }}
    />
  );
}

export type CinematicSectionProps = {
  children: ReactNode;
  className?: string;
  id?: string;
  /** Category color accent behind the section (see GLOW_COLORS). */
  glow?: string;
  /** Optional `--cat-rgb` source: set from a CategoryColor for exact identity. */
  cssVars?: { '--cat-rgb': string; '--cat-hex': string } | null;
  reveal?: boolean;
};

/**
 * A page section with a localized light and an optional section-level
 * dark→light reveal. Wraps a semantic `<section>`.
 */
export function CinematicSection({
  children,
  className,
  id,
  glow = 'cyan',
  cssVars,
  reveal = true,
}: CinematicSectionProps) {
  const inner = (
    <section
      id={id}
      style={(cssVars ?? undefined) as CSSProperties | undefined}
      className={`relative ${className ?? ''}`}
    >
      <SectionGlow glow={glow} />
      {children}
    </section>
  );
  return reveal ? <LightReveal>{inner}</LightReveal> : inner;
}
