import type { Metadata } from 'next';
import Link from 'next/link';
import { Check, Sparkles, Rocket, Building2 } from 'lucide-react';
import { Navbar } from '@/components/landing/navbar';
import { Footer } from '@/components/landing/footer';
import { CTA } from '@/components/landing/cta';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Pricing',
  description:
    'Stack2Set is free to use. Explore plans for individuals, startups, and teams — no credit card required.',
  alternates: { canonical: '/pricing' },
};

const plans = [
  {
    name: 'Free',
    icon: Sparkles,
    price: '$0',
    period: 'forever',
    description: 'Everything you need to explore ideas and build your first stack.',
    features: [
      'Unlimited project analyses',
      'AI-powered tech stack recommendations',
      'Provider comparison across categories',
      'Save and export your stack',
    ],
    highlighted: false,
    cta: { label: 'Start for free', href: '/' },
  },
  {
    name: 'Pro',
    icon: Rocket,
    price: '$9',
    period: 'per month',
    description: 'For developers building serious products and shipping to production.',
    features: [
      'Everything in Free',
      'Faster AI analysis',
      'Priority provider data',
      'Advanced stack comparisons',
      'Team sharing of stacks',
    ],
    highlighted: true,
    cta: { label: 'Go Pro', href: '/' },
  },
  {
    name: 'Team',
    icon: Building2,
    price: '$29',
    period: 'per month',
    description: 'For teams standardizing their technology decisions together.',
    features: [
      'Everything in Pro',
      'Shared workspace & stacks',
      'Team provider preferences',
      'Usage analytics',
      'Priority support',
    ],
    highlighted: false,
    cta: { label: 'Contact us', href: '/contact' },
  },
];

export default function PricingPage() {
  return (
    <main className="relative min-h-screen overflow-x-hidden">
      <Navbar />
      <div className="relative overflow-hidden px-4 pb-24 pt-32 sm:px-6 sm:pt-36">
        <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[400px] w-[700px] -translate-x-1/2 rounded-full bg-violet-600/10 blur-[120px]" />

        <header className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-medium text-violet-400">Pricing</p>
          <h1 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-5xl">
            Start <span className="gradient-text">free</span>, scale when you&apos;re ready
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Stack2Set is free for everyone today. Simple plans for developers, startups, and teams.
          </p>
        </header>

        <div className="mx-auto mt-16 grid max-w-5xl gap-6 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={cn(
                'relative rounded-3xl p-8 transition-all hover:-translate-y-1',
                plan.highlighted
                  ? 'glass shadow-xl shadow-violet-500/10 ring-1 ring-violet-500/40'
                  : 'glass',
              )}
            >
              {plan.highlighted && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-violet-500 to-blue-500 px-3 py-1 text-xs font-medium text-white">
                  Most popular
                </span>
              )}
              <div className="flex items-center gap-2">
                <plan.icon className="h-5 w-5 text-violet-400" />
                <h2 className="text-lg font-semibold text-foreground">{plan.name}</h2>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-4xl font-semibold tracking-tight text-foreground">
                  {plan.price}
                </span>
                <span className="text-sm text-muted-foreground">{plan.period}</span>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {plan.description}
              </p>
              <ul className="mt-6 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                    <span
                      className={cn(
                        'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full',
                        plan.highlighted ? 'bg-violet-500/20' : 'bg-emerald-500/15',
                      )}
                    >
                      <Check className={cn('h-2.5 w-2.5', plan.highlighted ? 'text-violet-400' : 'text-emerald-400')} />
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>
              <Link
                href={plan.cta.href}
                className={cn(
                  'mt-8 flex h-11 w-full items-center justify-center rounded-xl text-sm font-medium transition-all',
                  plan.highlighted
                    ? 'bg-gradient-to-r from-violet-500 to-blue-500 text-white shadow-lg shadow-violet-500/20 hover:from-violet-600 hover:to-blue-600'
                    : 'glass text-foreground hover:border-violet-500/30',
                )}
              >
                {plan.cta.label}
              </Link>
            </div>
          ))}
        </div>
      </div>
      <CTA />
      <Footer />
    </main>
  );
}
