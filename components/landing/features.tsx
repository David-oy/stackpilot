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
    gradient: 'from-violet-500/20 to-purple-500/20',
    iconColor: 'text-violet-300',
  },
  {
    icon: Plug,
    title: 'API Discovery',
    description: 'Find the right APIs for payments, email, search, maps, AI, and hundreds of other use cases.',
    gradient: 'from-blue-500/20 to-cyan-500/20',
    iconColor: 'text-blue-300',
  },
  {
    icon: Database,
    title: 'Database Discovery',
    description: 'Compare SQL, NoSQL, vector, and real-time databases to find the perfect fit for your data needs.',
    gradient: 'from-emerald-500/20 to-teal-500/20',
    iconColor: 'text-emerald-300',
  },
  {
    icon: ShieldCheck,
    title: 'Authentication Discovery',
    description: 'Explore auth providers — OAuth, magic links, biometrics — and pick the right one for your app.',
    gradient: 'from-amber-500/20 to-orange-500/20',
    iconColor: 'text-amber-300',
  },
  {
    icon: HardDrive,
    title: 'Storage Discovery',
    description: 'Browse file and object storage solutions with pricing, limits, and feature comparisons.',
    gradient: 'from-pink-500/20 to-rose-500/20',
    iconColor: 'text-pink-300',
  },
  {
    icon: Blocks,
    title: 'Build Stack',
    description: 'Assemble technologies into a shareable tech stack and visualize how everything fits together.',
    gradient: 'from-indigo-500/20 to-blue-500/20',
    iconColor: 'text-indigo-300',
  },
  {
    icon: GitCompare,
    title: 'Compare Providers',
    description: 'Side-by-side comparisons of pricing, features, and performance across every category.',
    gradient: 'from-violet-500/20 to-fuchsia-500/20',
    iconColor: 'text-fuchsia-300',
  },
  {
    icon: Bookmark,
    title: 'Save Projects',
    description: 'Save your tech stacks and project plans, revisit them anytime, and share with your team.',
    gradient: 'from-cyan-500/20 to-sky-500/20',
    iconColor: 'text-cyan-300',
  },
];

export function Features() {
  return (
    <section id="features" className="relative py-24">
      <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-700/10 blur-[140px]" />
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium text-violet-400">Features</p>
          <h2 className="mt-3 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            Everything you need to <span className="gradient-text">build smarter</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Powerful tools to discover, compare, and assemble the perfect technology stack for any project.
          </p>
        </div>

        <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="glass glass-hover group rounded-2xl p-6"
            >
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${feature.gradient} ring-1 ring-foreground/10 transition-transform group-hover:scale-110`}
              >
                <feature.icon className={`h-6 w-6 ${feature.iconColor}`} />
              </div>
              <h3 className="mt-5 text-base font-semibold text-foreground">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
