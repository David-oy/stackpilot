'use client';

import { motion, useReducedMotion } from 'framer-motion';
import {
  Brain,
  Plug,
  Database,
  ShieldCheck,
  HardDrive,
  Blocks,
  GitCompare,
  Bookmark,
} from 'lucide-react';

const features = [
  {
    icon: Brain,
    title: 'AI Project Planner',
    description: 'Describe your idea in plain English and get a complete project blueprint with recommended technologies.',
    gradient: 'from-teal-500 to-cyan-500',
    iconColor: 'text-teal-300',
    tint: 'bg-teal-500/10',
  },
  {
    icon: Plug,
    title: 'API Discovery',
    description: 'Find the right APIs for payments, email, search, maps, AI, and hundreds of other use cases.',
    gradient: 'from-blue-500 to-cyan-500',
    iconColor: 'text-blue-300',
    tint: 'bg-blue-500/10',
  },
  {
    icon: Database,
    title: 'Database Discovery',
    description: 'Compare SQL, NoSQL, vector, and real-time databases to find the perfect fit for your data needs.',
    gradient: 'from-emerald-500 to-teal-500',
    iconColor: 'text-emerald-300',
    tint: 'bg-emerald-500/10',
  },
  {
    icon: ShieldCheck,
    title: 'Authentication Discovery',
    description: 'Explore auth providers — OAuth, magic links, biometrics — and pick the right one for your app.',
    gradient: 'from-amber-500 to-orange-500',
    iconColor: 'text-amber-300',
    tint: 'bg-amber-500/10',
  },
  {
    icon: HardDrive,
    title: 'Storage Discovery',
    description: 'Browse file and object storage solutions with pricing, limits, and feature comparisons.',
    gradient: 'from-pink-500 to-rose-500',
    iconColor: 'text-pink-300',
    tint: 'bg-pink-500/10',
  },
  {
    icon: Blocks,
    title: 'Build Stack',
    description: 'Assemble technologies into a shareable tech stack and visualize how everything fits together.',
    gradient: 'from-indigo-500 to-blue-500',
    iconColor: 'text-indigo-300',
    tint: 'bg-indigo-500/10',
  },
  {
    icon: GitCompare,
    title: 'Compare Providers',
    description: 'Side-by-side comparisons of pricing, features, and performance across every category.',
    gradient: 'from-teal-500 to-cyan-500',
    iconColor: 'text-fuchsia-300',
    tint: 'bg-fuchsia-500/10',
  },
  {
    icon: Bookmark,
    title: 'Save Projects',
    description: 'Save your tech stacks and project plans, revisit them anytime, and share with your team.',
    gradient: 'from-cyan-500 to-sky-500',
    iconColor: 'text-cyan-300',
    tint: 'bg-cyan-500/10',
  },
];

export function Features() {
  const reduceMotion = useReducedMotion();
  return (
    <section id="features" className="relative py-24 sm:py-28">
      <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-teal-500/10 blur-[140px]" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium text-teal-400">Features</p>
          <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-5xl">
            Everything you need to <span className="gradient-text">build smarter</span>
          </h2>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">
            Powerful tools to discover, compare, and assemble the perfect technology stack for any
            project.
          </p>
        </div>

        <div className="mt-16 grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={reduceMotion ? false : { opacity: 0, y: 28 }}
              whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5, delay: (index % 4) * 0.08, ease: 'easeOut' }}
            >
              <div className="group relative h-full overflow-hidden rounded-2xl glass p-6 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-teal-500/10">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-teal-500/60 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                />
                <div
                  aria-hidden="true"
                  className={`pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-gradient-to-br ${feature.gradient} opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-20`}
                />
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl ${feature.tint} ring-1 ring-foreground/10 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3`}
                >
                  <feature.icon className={`h-6 w-6 ${feature.iconColor}`} />
                </div>
                <h3 className="mt-5 text-base font-semibold tracking-tight text-foreground">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
