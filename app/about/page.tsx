import type { Metadata } from 'next';
import { Sparkles } from 'lucide-react';
import { StaticPage } from '@/components/pages/static-page';
import { siteConfig } from '@/lib/site';

export const metadata: Metadata = {
  title: 'About',
  description:
    'StackPilot uses AI to turn a project idea into a complete technology stack — discover, compare, and assemble the perfect stack in minutes.',
  alternates: { canonical: '/about' },
};

const sections = [
  {
    title: 'Our mission',
    body: 'Choosing the right technology is the hardest part of starting any project. StackPilot removes the guesswork by analyzing your idea and recommending a complete, production-ready stack — so you spend your time building, not researching.',
  },
  {
    title: 'What we believe',
    items: [
      { title: 'Speed matters', body: 'The best stack is the one you can ship today. We recommend proven, production-ready options over endless alternatives.' },
      { title: 'Explain every choice', body: 'Every recommendation comes with a reason, best use cases, and links to verify it yourself.' },
      { title: 'Free for builders', body: 'StackPilot is free to use. We believe great developer tools should be accessible to everyone.' },
      { title: 'Open and honest', body: 'Providers are marked with free-tier and open-source indicators, so you always know what you are choosing.' },
    ],
  },
  {
    title: 'Built with StackPilot',
    body: `StackPilot itself was built the way we recommend you build: ${siteConfig.name} is a Next.js application with AI-powered analysis, deployed and served at global edge.`,
  },
];

export default function AboutPage() {
  return (
    <StaticPage
      eyebrow="About"
      title="The AI copilot for"
      highlight="choosing your stack"
      description={`${siteConfig.name} is an AI-powered developer tool that analyzes a project idea and recommends the best technologies, APIs, databases, authentication providers, hosting services, and developer tools to build it.`}
      sections={sections}
    />
  );
}
