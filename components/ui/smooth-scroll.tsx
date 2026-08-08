'use client';

import { useEffect } from 'react';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import { useReducedMotion } from 'framer-motion';

declare global {
  interface Window {
    __lenis?: Lenis;
  }
}

export function SmoothScroll() {
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) return;

    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.6,
      autoRaf: true,
    });
    window.__lenis = lenis;

    return () => {
      window.__lenis = undefined;
      lenis.destroy();
    };
  }, [reduceMotion]);

  return null;
}
