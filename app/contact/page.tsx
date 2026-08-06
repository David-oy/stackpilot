import type { Metadata } from 'next';
import { Github, Mail, Twitter, MessageSquare } from 'lucide-react';
import { Navbar } from '@/components/landing/navbar';
import { Footer } from '@/components/landing/footer';
import { siteConfig } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Get in touch with the StackPilot team — report issues, ask questions, or share feedback.',
  alternates: { canonical: '/contact' },
};

const options = [
  {
    icon: Github,
    title: 'GitHub Issues',
    description: 'Report a bug or request a feature. Issues get the fastest response.',
    href: siteConfig.github,
    color: 'text-foreground',
  },
  {
    icon: MessageSquare,
    title: 'Discussions',
    description: 'Ask questions and share your stacks with the community.',
    href: siteConfig.github,
    color: 'text-violet-400',
  },
  {
    icon: Mail,
    title: 'Email us',
    description: 'For anything else, drop us a line — we read everything.',
    href: 'mailto:hello@get-stack.vercel.app',
    color: 'text-sky-400',
  },
  {
    icon: Twitter,
    title: 'Twitter / X',
    description: 'Follow and message for updates and quick questions.',
    href: 'https://x.com/vijayyyyy_7',
    color: 'text-sky-400',
  },
];

export default function ContactPage() {
  return (
    <main className="relative min-h-screen overflow-x-hidden">
      <Navbar />
      <div className="relative overflow-hidden px-4 pb-24 pt-32 sm:px-6 sm:pt-36">
        <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[400px] w-[700px] -translate-x-1/2 rounded-full bg-violet-600/10 blur-[120px]" />

        <header className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-medium text-violet-400">Contact</p>
          <h1 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-5xl">
            Let&apos;s <span className="gradient-text">talk</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Found a bug, have a feature idea, or just want to say hi? Pick the channel that works
            best for you.
          </p>
        </header>

        <div className="mx-auto mt-16 grid max-w-4xl gap-4 sm:grid-cols-2">
          {options.map((option) => (
            <a
              key={option.title}
              href={option.href}
              target={option.href.startsWith('http') ? '_blank' : undefined}
              rel={option.href.startsWith('http') ? 'noopener noreferrer' : undefined}
              className="glass glass-hover group rounded-2xl p-6 transition-all hover:-translate-y-1"
            >
              <option.icon className={`h-6 w-6 ${option.color}`} />
              <h2 className="mt-3 text-sm font-semibold text-foreground group-hover:text-violet-400">
                {option.title}
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {option.description}
              </p>
            </a>
          ))}
        </div>
      </div>
      <Footer />
    </main>
  );
}
