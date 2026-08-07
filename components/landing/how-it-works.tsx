import { PencilLine, Cpu, Layers } from 'lucide-react';
import { Reveal } from '@/components/ui/reveal';

const steps = [
  {
    number: '01',
    icon: PencilLine,
    title: 'Describe your project',
    description:
      'Tell Stack2Set what you want to build. A YouTube clone, a Spotify-like app, an AI chatbot — anything.',
  },
  {
    number: '02',
    icon: Cpu,
    title: 'AI identifies required categories',
    description:
      'Our AI analyzes your idea and identifies every technology category your project needs — from databases to payments.',
  },
  {
    number: '03',
    icon: Layers,
    title: 'Choose providers & build your stack',
    description:
      'Browse recommended providers for each category, compare them, and assemble your perfect tech stack.',
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="relative py-24 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-medium text-violet-400">How It Works</p>
            <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-5xl">
              From idea to stack in <span className="gradient-text">three steps</span>
            </h2>
            <p className="mt-4 text-base text-muted-foreground sm:text-lg">
              No more endless research. Describe what you want to build and let AI do the heavy
              lifting.
            </p>
          </div>
        </Reveal>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {steps.map((step, i) => (
            <Reveal key={step.number} delay={i * 0.1}>
              <div className="relative h-full">
                <div className="glass glass-hover h-full rounded-2xl p-8 transition-all duration-300 hover:-translate-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-blue-500/20 ring-1 ring-violet-500/20 transition-transform duration-300 group-hover:scale-110">
                      <step.icon className="h-6 w-6 text-violet-300" />
                    </div>
                    <span className="text-4xl font-bold text-foreground/10">{step.number}</span>
                  </div>
                  <h3 className="mt-6 text-xl font-semibold tracking-tight text-foreground">
                    {step.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {step.description}
                  </p>
                </div>
                {i < steps.length - 1 && (
                  <div className="absolute -right-3 top-1/2 hidden h-px w-6 bg-gradient-to-r from-violet-500/40 to-transparent md:block" />
                )}
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
