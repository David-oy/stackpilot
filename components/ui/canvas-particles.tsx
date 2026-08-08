'use client';

import { useEffect, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';
import { useEffectLevel, useTabVisible } from '@/hooks/use-cinema';

type Particle = {
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  hue: string;
  alpha: number;
  twinkle: number;
};

const COUNT_BY_LEVEL = { low: 22, mid: 42, full: 72 };

/**
 * Lightweight canvas particle field used as the "generative technology"
 * backdrop. Drifting, twinkling glowing points in the category palette.
 *
 * - Adapts particle count to the device level.
 * - Pauses when the tab is hidden.
 * - Renders nothing (static empty canvas) under prefers-reduced-motion.
 */
export function CanvasParticles({
  colors,
  className,
  speed = 1,
}: {
  /** Stable array of CSS colors, e.g. `rgba(34, 211, 238, 0.7)`. Pass a module constant. */
  colors: string[];
  className?: string;
  speed?: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const level = useEffectLevel();
  const tabVisible = useTabVisible();
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) return;
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    let particles: Particle[] = [];
    let width = 0;
    let height = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);

    const spawn = () => {
      const count = COUNT_BY_LEVEL[level];
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: 0.6 + Math.random() * 1.9,
        vx: (Math.random() - 0.5) * 0.18 * speed,
        vy: (-0.06 - Math.random() * 0.22) * speed,
        hue: colors[Math.floor(Math.random() * colors.length)],
        alpha: 0.14 + Math.random() * 0.5,
        twinkle: Math.random() * Math.PI * 2,
      }));
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      spawn();
    };

    const step = () => {
      if (tabVisible) {
        ctx.clearRect(0, 0, width, height);
        for (const p of particles) {
          p.x += p.vx;
          p.y += p.vy;
          if (p.y < -8) {
            p.y = height + 8;
            p.x = Math.random() * width;
          }
          if (p.x < -8) p.x = width + 8;
          if (p.x > width + 8) p.x = -8;
          const alpha = p.alpha * (0.7 + 0.3 * Math.sin(p.twinkle));
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fillStyle = p.hue;
          ctx.globalAlpha = alpha;
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      }
      raf = requestAnimationFrame(step);
    };

    resize();
    raf = requestAnimationFrame(step);
    window.addEventListener('resize', resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, [reduceMotion, level, colors, speed, tabVisible]);

  return <canvas ref={ref} className={className} aria-hidden="true" />;
}
