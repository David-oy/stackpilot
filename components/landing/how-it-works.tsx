'use client';

import { useRef } from 'react';
import {
  motion,
  useInView,
  useReducedMotion,
  useScroll,
  useTransform,
} from 'framer-motion';
import { PencilLine, Cpu, Layers } from 'lucide-react';
import { Reveal } from '@/components/ui/reveal';

const steps = [
  {
    number: '01',
    icon: PencilLine,
    title: 'Describe your project',
    description:
      'Tell Stack2Set what you want to build. A YouTube clone, a Spotify-like app, an AI chatbot — anything.',
    iconBox: 'from-purple-500/25 to-fuchsia-500/10 ring-purple-500/25',
    iconColor: 'text-purple-300',
    labelColor: 'text-purple-400/80',
    mobileLine: 'from-purple-500/60',
    rgb: '168, 85, 247',
  },
  {
    number: '02',
    icon: Cpu,
    title: 'AI identifies required categories',
    description:
      'Our AI analyzes your idea and identifies every technology category your project needs — from databases to payments.',
    iconBox: 'from-cyan-500/25 to-teal-500/10 ring-cyan-500/25',
    iconColor: 'text-cyan-300',
    labelColor: 'text-cyan-400/80',
    mobileLine: 'from-cyan-500/60',
    rgb: '34, 211, 238',
  },
  {
    number: '03',
    icon: Layers,
    title: 'Choose providers & build your stack',
    description:
      'Browse recommended providers for each category, compare them, and assemble your perfect tech stack.',
    iconBox: 'from-emerald-500/25 to-green-500/10 ring-emerald-500/25',
    iconColor: 'text-emerald-300',
    labelColor: 'text-emerald-400/80',
    mobileLine: 'from-emerald-500/60',
    rgb: '52, 211, 153',
  },
];

function StepCard({ step, index }: { step: (typeof steps)[number]; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const inView = useInView(ref, { once: false, margin: '-18% 0px -18% 0px' });

  return (
    <div ref={ref} className="relative h-full">
      <motion.div
        initial={reduceMotion ? false : { opacity: 0.3, filter: 'brightness(0.75)' }}
        animate={
          inView
            ? { opacity: 1, filter: 'brightness(1)' }
            : reduceMotion
              ? { opacity: 1, filter: 'brightness(1)' }
              : { opacity: 0.3, filter: 'brightness(0.75)' }
        }
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className="glass glass-hover group h-full rounded-2xl p-8 transition-all duration-300 hover:-translate-y-1"
        style={{
          boxShadow: inView
            ? `0 0 46px rgba(${step.rgb}, 0.13), inset 0 1px 0 rgba(255, 255, 255, 0.04)`
            : 'none',
        }}
      >
        <div className="flex items-center justify-between">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ring-1 transition-transform duration-300 group-hover:scale-110 ${step.iconBox}`}
          >
            <step.icon className={`h-6 w-6 ${step.iconColor}`} />
          </div>
          <span className={`text-sm font-semibold tracking-widest ${step.labelColor}`}>
            Step {step.number}
          </span>
        </div>
        <h3 className="mt-6 text-xl font-semibold tracking-tight text-foreground">{step.title}</h3>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{step.description}</p>
      </motion.div>
      {index < steps.length - 1 && (
        <div
          aria-hidden="true"
          className={`absolute left-1/2 top-full h-12 w-px -translate-x-1/2 bg-gradient-to-b to-transparent md:hidden ${step.mobileLine}`}
        />
      )}
    </div>
  );
}

export function HowItWorks() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start 0.85', 'end 0.6'],
  });

  const lineProgress = useTransform(scrollYProgress, [0, 0.25, 0.8, 1], [0, 0.12, 0.9, 1]);
  const dotX = useTransform(lineProgress, (p) => `${5 + p * 90}%`);

  return (
    <section id="how-it-works" className="relative py-24 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-medium text-teal-400">How It Works</p>
            <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-5xl">
              From idea to stack in <span className="gradient-text">three steps</span>
            </h2>
            <p className="mt-4 text-base text-muted-foreground sm:text-lg">
              No more endless research. Describe what you want to build and let AI do the heavy
              lifting.
            </p>
          </div>
        </Reveal>

        <div ref={sectionRef} className="relative mt-16 grid gap-12 md:grid-cols-3 md:gap-6">
          {/* Scroll-linked connecting trail (desktop) */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-[14%] top-14 hidden md:block"
          >
            <svg className="h-4 w-full" viewBox="0 0 100 4" preserveAspectRatio="none">
              <defs>
                <linearGradient id="cinema-trail" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="rgba(168, 85, 247, 0.8)" />
                  <stop offset="50%" stopColor="rgba(34, 211, 238, 0.8)" />
                  <stop offset="100%" stopColor="rgba(52, 211, 153, 0.8)" />
                </linearGradient>
              </defs>
              <line
                x1="0"
                y1="2"
                x2="100"
                y2="2"
                stroke="rgba(255, 255, 255, 0.08)"
                strokeWidth="1.5"
              />
              <motion.line
                x1="0"
                y1="2"
                x2="100"
                y2="2"
                stroke="url(#cinema-trail)"
                strokeWidth="1.5"
                strokeLinecap="round"
                style={{ pathLength: reduceMotion ? 1 : lineProgress }}
              />
            </svg>
            <motion.span
              style={{ left: reduceMotion ? '50%' : dotX }}
              className="absolute top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-purple-400 via-cyan-400 to-emerald-400 shadow-[0_0_12px_rgba(94,234,212,0.8)]"
            />
          </div>

          {steps.map((step, i) => (
            <Reveal key={step.number} delay={i * 0.05} y={18}>
              <StepCard step={step} index={i} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
