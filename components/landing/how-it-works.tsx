import { PencilLine, Cpu, Layers } from 'lucide-react';

const steps = [
  {
    number: '01',
    icon: PencilLine,
    title: 'Describe your project',
    description:
      'Tell StackPilot what you want to build. A YouTube clone, a Spotify-like app, an AI chatbot — anything.',
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
    <section id="how-it-works" className="relative py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium text-violet-400">How It Works</p>
          <h2 className="mt-3 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            From idea to stack in <span className="gradient-text">three steps</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            No more endless research. Describe what you want to build and let AI do the heavy lifting.
          </p>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {steps.map((step, i) => (
            <div key={step.number} className="relative">
              <div className="glass glass-hover h-full rounded-2xl p-8">
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-blue-500/20 ring-1 ring-violet-500/20">
                    <step.icon className="h-6 w-6 text-violet-300" />
                  </div>
                  <span className="text-4xl font-bold text-white/10">{step.number}</span>
                </div>
                <h3 className="mt-6 text-xl font-semibold text-white">{step.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{step.description}</p>
              </div>
              {i < steps.length - 1 && (
                <div className="absolute -right-3 top-1/2 hidden h-px w-6 bg-gradient-to-r from-violet-500/40 to-transparent md:block" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
