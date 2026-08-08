'use client';

import { useEffect, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';
import { usePauseWhenHidden } from './scroll-lighting';

/**
 * Generative "technology emerging from darkness" field for the hero.
 *
 * A lightweight canvas of category-colored particles that slowly drift and
 * connect, with a subtle mouse-parallax depth. Degrades gracefully:
 *  - reduced motion  → static soft light blobs (no canvas)
 *  - tablet          → fewer particles
 *  - mobile          → minimal particles, no connections
 *  - hidden tab      → skips drawing
 */
const PALETTE = [
  '#c084fc', // purple  — frontend
  '#60a5fa', // blue    — backend
  '#22d3ee', // cyan    — cloud
  '#4ade80', // green   — database
  '#fb923c', // orange  — auth
  '#f472b6', // pink    — payments
  '#a78bfa', // violet  — ai
  '#facc15', // yellow  — analytics
];

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  color: string;
  alpha: number;
  phase: number;
};

const STATIC_BLOBS = [
  { size: 520, color: 'rgba(168,85,247,0.12)', left: '8%', top: '10%' },
  { size: 460, color: 'rgba(34,211,238,0.10)', left: '70%', top: '18%' },
  { size: 420, color: 'rgba(244,114,182,0.07)', left: '55%', top: '60%' },
  { size: 380, color: 'rgba(52,211,153,0.08)', left: '18%', top: '66%' },
];

export function HeroField({ className = '' }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduceMotion = useReducedMotion();
  const hidden = usePauseWhenHidden();
  const hiddenRef = useRef(hidden);
  hiddenRef.current = hidden;

  useEffect(() => {
    if (reduceMotion) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    let raf = 0;
    let width = 0;
    let height = 0;
    let density = 1;
    let linkDistance = 120;
    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    let particles: Particle[] = [];

    const media = window.matchMedia('(max-width: 767px)');
    const tablet = window.matchMedia('(min-width: 768px) and (max-width: 1023px)');

    const applyDensity = () => {
      if (media.matches) {
        density = 0.28;
        linkDistance = 0;
      } else if (tablet.matches) {
        density = 0.5;
        linkDistance = 90;
      } else {
        density = 1;
        linkDistance = 120;
      }
    };
    applyDensity();
    media.addEventListener('change', applyDensity);
    tablet.addEventListener('change', applyDensity);

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.max(12, Math.round(((width * height) / 16000) * density));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.16,
        vy: (Math.random() - 0.5) * 0.16,
        r: 0.8 + Math.random() * 1.8,
        color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
        alpha: 0.22 + Math.random() * 0.5,
        phase: Math.random() * Math.PI * 2,
      }));
    };

    const onMouse = (event: MouseEvent) => {
      mouse.tx = (event.clientX / window.innerWidth - 0.5) * 2;
      mouse.ty = (event.clientY / window.innerHeight - 0.5) * 2;
    };

    const draw = (time: number) => {
      raf = requestAnimationFrame(draw);
      if (hiddenRef.current) return;
      ctx.clearRect(0, 0, width, height);

      mouse.x += (mouse.tx - mouse.x) * 0.045;
      mouse.y += (mouse.ty - mouse.y) * 0.045;

      if (linkDistance > 0) {
        ctx.lineWidth = 1;
        for (let i = 0; i < particles.length; i++) {
          const a = particles[i];
          for (let j = i + 1; j < particles.length; j++) {
            const b = particles[j];
            const dx = a.x - b.x;
            const dy = a.y - b.y;
            const d2 = dx * dx + dy * dy;
            if (d2 < linkDistance * linkDistance) {
              const alpha = (1 - Math.sqrt(d2) / linkDistance) * 0.07;
              ctx.strokeStyle = `rgba(148,163,184,${alpha})`;
              ctx.beginPath();
              ctx.moveTo(a.x, a.y);
              ctx.lineTo(b.x, b.y);
              ctx.stroke();
            }
          }
        }
      }

      const parallax = 16;
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -24) p.x = width + 24;
        if (p.x > width + 24) p.x = -24;
        if (p.y < -24) p.y = height + 24;
        if (p.y > height + 24) p.y = -24;

        const twinkle = 0.7 + 0.3 * Math.sin(time / 850 + p.phase);
        const depth = p.r / 2.6;
        ctx.globalAlpha = p.alpha * twinkle;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x + mouse.x * parallax * depth, p.y + mouse.y * parallax * depth, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', onMouse, { passive: true });
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouse);
      media.removeEventListener('change', applyDensity);
      tablet.removeEventListener('change', applyDensity);
    };
  }, [reduceMotion]);

  return (
    <div aria-hidden="true" className={`pointer-events-none absolute inset-0 -z-10 ${className}`}>
      {reduceMotion ? (
        <>
          {STATIC_BLOBS.map((blob, index) => (
            <div
              key={index}
              className="absolute rounded-full"
              style={{
                width: blob.size,
                height: blob.size,
                left: blob.left,
                top: blob.top,
                background: `radial-gradient(circle, ${blob.color} 0%, transparent 70%)`,
              }}
            />
          ))}
        </>
      ) : (
        <canvas
          ref={canvasRef}
          data-cinematic-canvas
          className="h-full w-full"
        />
      )}
    </div>
  );
}
