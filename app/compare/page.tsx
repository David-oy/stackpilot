import type { Metadata } from 'next';
import { StaticPage } from '@/components/pages/static-page';

export const metadata: Metadata = {
  title: 'Compare',
  description:
    'Compare technology providers side-by-side with StackPilot: rankings, best use cases, free tiers, and open-source indicators.',
  alternates: { canonical: '/compare' },
};

const sections = [
  {
    title: 'Compare with confidence',
    body: 'Every category page ranks multiple providers, so you can compare options before adding one to your stack.',
    items: [
      { title: 'Ranked providers', body: 'Providers are ranked from the best overall fit for your project to niche or beginner-friendly alternatives.', href: '/docs/compare' },
      { title: 'Best use cases', body: 'Each provider shows the scenarios where it shines, so you can match it to your exact needs.', href: '/docs/compare' },
      { title: 'Free tiers', body: 'See which providers let you start without paying — perfect for MVPs and side projects.', href: '/docs/compare' },
      { title: 'Open source', body: 'Identify self-hostable, auditable open-source options when you want full control.', href: '/docs/compare' },
    ],
  },
  {
    title: 'Start comparing',
    body: 'Pick a category to see its providers ranked side-by-side.',
    items: [
      { title: 'Database providers', body: 'PostgreSQL, MongoDB, Redis, Supabase, PlanetScale and more.', href: '/category?id=database&name=Database' },
      { title: 'Authentication providers', body: 'Clerk, Auth0, Supabase Auth, NextAuth and more.', href: '/category?id=authentication&name=Authentication' },
      { title: 'Hosting providers', body: 'Vercel, Netlify, Railway, AWS, and more.', href: '/category?id=hosting&name=Hosting' },
      { title: 'Payment providers', body: 'Stripe, Paddle, Lemon Squeezy and billing APIs.', href: '/docs/payments' },
      { title: 'Cloud providers', body: 'AWS, Google Cloud, Azure and serverless platforms.', href: '/docs/cloud' },
      { title: 'Email providers', body: 'Resend, SendGrid, Postmark and more.', href: '/category?id=email&name=Email' },
    ],
  },
];

export default function ComparePage() {
  return (
    <StaticPage
      eyebrow="Compare"
      title="Pick the right provider"
      highlight="for the job"
      description="Ranked providers, best use cases, free-tier and open-source indicators — everything you need to choose wisely."
      sections={sections}
    />
  );
}
