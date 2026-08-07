'use client';

import { motion } from 'framer-motion';
import {
  Sparkles,
  Zap,
  Database,
  ShieldCheck,
  Cloud,
  CreditCard,
  Rocket,
  Bot,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type Badge = {
  icon: LucideIcon;
  label: string;
  gradient: string;
  tilt: number;
  duration: number;
  delay: number;
};

const badges: Badge[] = [
  { icon: Sparkles, label: 'AI Powered', gradient: 'from-violet-500 to-purple-500', tilt: -6, duration: 6, delay: 0 },
  { icon: Zap, label: 'Fast Recommendations', gradient: 'from-amber-400 to-orange-500', tilt: 5, duration: 5.5, delay: 0.06 },
  { icon: Database, label: 'Database Discovery', gradient: 'from-emerald-400 to-teal-500', tilt: -4, duration: 6.5, delay: 0.12 },
  { icon: ShieldCheck, label: 'Authentication', gradient: 'from-sky-400 to-blue-500', tilt: 6, duration: 5.8, delay: 0.18 },
  { icon: Cloud, label: 'Cloud Ready', gradient: 'from-cyan-400 to-sky-500', tilt: -5, duration: 6.2, delay: 0.24 },
  { icon: CreditCard, label: 'Payments', gradient: 'from-fuchsia-400 to-pink-500', tilt: 4, duration: 5.6, delay: 0.3 },
  { icon: Rocket, label: 'Production Ready', gradient: 'from-rose-400 to-red-500', tilt: -6, duration: 6.4, delay: 0.36 },
  { icon: Bot, label: 'AI Generated', gradient: 'from-indigo-400 to-violet-500', tilt: 5, duration: 5.9, delay: 0.42 },
];

export function FloatingBadges() {
  return (
    <section
      aria-label="What Stack2Set offers"
      className="relative px-4 py-10 sm:px-6 sm:py-14"
    >
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-3 sm:gap-4">
        {badges.map((badge) => (
          <motion.div
            key={badge.label}
            initial={{ opacity: 0, y: 24, scale: 0.9 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5, delay: badge.delay, ease: 'easeOut' }}
            style={
              {
                '--tilt': `${badge.tilt}deg`,
                '--float-duration': `${badge.duration}s`,
                '--float-delay': `${badge.delay}s`,
              } as React.CSSProperties
            }
          >
            <div className="animate-float-badge group flex items-center gap-2.5 rounded-2xl glass glass-hover px-4 py-2.5 transition-all duration-300 hover:-translate-y-1 sm:gap-3 sm:px-5 sm:py-3">
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${badge.gradient} shadow-md sm:h-8 sm:w-8`}
              >
                <badge.icon className="h-4 w-4 text-white sm:h-4.5 sm:w-4.5" />
              </span>
              <span className="whitespace-nowrap text-xs font-medium text-foreground sm:text-sm">
                {badge.label}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
