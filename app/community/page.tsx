import type { Metadata } from 'next';
import { Github, Twitter, Linkedin, MessagesSquare } from 'lucide-react';
import { Navbar } from '@/components/landing/navbar';
import { Footer } from '@/components/landing/footer';
import { siteConfig } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Community',
  description:
    'Join the StackPilot community on GitHub and Twitter. Share your stacks, ask questions, and shape what gets built next.',
  alternates: { canonical: '/community' },
};

const channels = [
  {
    icon: Github,
    name: 'GitHub',
    description: 'Browse the code, open issues, and contribute to StackPilot.',
    href: siteConfig.github,
    color: 'text-foreground',
  },
  {
    icon: Twitter,
    name: 'Twitter / X',
    description: 'Follow for product updates, tips, and stack inspiration.',
    href: 'https://x.com/vijayyyyy_7',
    color: 'text-sky-400',
  },
  {
    icon: MessagesSquare,
    name: 'Discussions',
    description: 'Ask questions and share your stacks with other builders.',
    href: siteConfig.github,
    color: 'text-violet-400',
  },
];

export default function CommunityPage() {
  return (
    <main className="relative min-h-screen overflow-x-hidden">
      <Navbar />
      <div className="relative overflow-hidden px-4 pb-24 pt-32 sm:px-6 sm:pt-36">
        <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[400px] w-[700px] -translate-x-1/2 rounded-full bg-violet-600/10 blur-[120px]" />

        <header className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-medium text-violet-400">Community</p>
          <h1 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-5xl">
            Built for developers, <span className="gradient-text">by developers</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Share your stacks, ask questions, and help shape what StackPilot builds next.
          </p>
        </header>

        <div className="mx-auto mt-16 grid max-w-4xl gap-4 sm:grid-cols-3">
          {channels.map((channel) => (
            <a
              key={channel.name}
              href={channel.href}
              target="_blank"
              rel="noopener noreferrer"
              className="glass glass-hover group rounded-2xl p-6 text-center transition-all hover:-translate-y-1"
            >
              <channel.icon className={`mx-auto h-7 w-7 ${channel.color}`} />
              <h2 className="mt-3 text-sm font-semibold text-foreground">{channel.name}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {channel.description}
              </p>
            </a>
          ))}
        </div>
      </div>
      <Footer />
    </main>
  );
}
