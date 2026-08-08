'use client';

import { useEffect, useState } from 'react';

export type EffectLevel = 'low' | 'mid' | 'full';

/**
 * Adaptive effect level based on the viewport:
 * - low  → mobile (reduced particle counts, no heavy lighting)
 * - mid  → tablet (moderate effects)
 * - full → desktop (full cinematic treatment)
 */
export function useEffectLevel(): EffectLevel {
  const [level, setLevel] = useState<EffectLevel>('full');

  useEffect(() => {
    const mobile = window.matchMedia('(max-width: 767px)');
    const tablet = window.matchMedia('(min-width: 768px) and (max-width: 1023px)');

    const apply = () => {
      if (mobile.matches) setLevel('low');
      else if (tablet.matches) setLevel('mid');
      else setLevel('full');
    };

    apply();
    mobile.addEventListener('change', apply);
    tablet.addEventListener('change', apply);
    return () => {
      mobile.removeEventListener('change', apply);
      tablet.removeEventListener('change', apply);
    };
  }, []);

  return level;
}

/**
 * True while the tab is visible. Animation loops should pause when the tab
 * is hidden to save battery and keep Core Web Vitals healthy.
 */
export function useTabVisible(): boolean {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const onVisibility = () => setVisible(document.visibilityState === 'visible');
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  return visible;
}
