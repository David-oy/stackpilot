import type { Metadata } from 'next';
import { StaticPage } from '@/components/pages/static-page';

export const metadata: Metadata = {
  title: 'Features',
  description:
    'Explore Stack2Set features: AI project planning, API discovery, database recommendations, provider comparison, and stack building.',
  alternates: { canonical: '/features' },
};

const sections = [
  {
    title: 'Core features',
    body: 'Stack2Set turns a project idea into a complete technology blueprint — automatically.',
    items: [
      { title: 'AI Project Planner', body: 'Describe your idea in plain English and get a complete project blueprint with recommended technologies.', href: '/docs/ai' },
      { title: 'API Discovery', body: 'Find the right APIs for payments, email, search, maps, AI, and hundreds of other use cases.', href: '/docs/tech-discovery' },
      { title: 'Database Discovery', body: 'Compare SQL, NoSQL, vector, and real-time databases to find the perfect fit for your data needs.', href: '/docs/databases' },
      { title: 'Authentication Discovery', body: 'Explore auth providers — OAuth, magic links, biometrics — and pick the right one for your app.', href: '/docs/authentication' },
      { title: 'Provider Comparison', body: 'Side-by-side comparisons of pricing, features, and performance across every category.', href: '/docs/compare' },
      { title: 'Build & Save Stacks', body: 'Assemble technologies into a shareable tech stack and save your project plans.', href: '/docs/getting-started' },
    ],
  },
  {
    title: 'Covered categories',
    body: 'Recommendations span every layer of a modern application.',
    items: [
      { title: 'Authentication', body: 'Clerk, Auth0, Supabase Auth, NextAuth and more.', href: '/browse/categories/authentication' },
      { title: 'Database', body: 'PostgreSQL, MongoDB, Redis, and vector databases.', href: '/browse/categories/database' },
      { title: 'Storage', body: 'Cloudinary, S3, and object storage solutions.', href: '/browse/categories/storage' },
      { title: 'Video APIs', body: 'Streaming, transcoding, and live video providers.', href: '/browse/categories/video-apis' },
      { title: 'Email & Notifications', body: 'Transactional email and multi-channel notifications.', href: '/browse/categories/email' },
      { title: 'Hosting & CDN', body: 'Vercel, Netlify, Cloudflare, and global CDNs.', href: '/browse/categories/hosting' },
    ],
  },
];

export default function FeaturesPage() {
  return (
    <StaticPage
      eyebrow="Features"
      title="Everything you need to"
      highlight="build smarter"
      description="Powerful tools to discover, compare, and assemble the perfect technology stack for any project."
      sections={sections}
    />
  );
}
