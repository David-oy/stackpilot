import type { Metadata } from 'next';
import { StaticPage } from '@/components/pages/static-page';

export const metadata: Metadata = {
  title: 'Explore',
  description:
    'Explore technology categories with StackPilot: databases, authentication, storage, video APIs, CDN, email, notifications, analytics, and hosting.',
  alternates: { canonical: '/explore' },
};

const sections = [
  {
    title: 'Browse every layer of your stack',
    body: 'Every app needs more than a frontend. StackPilot explores every technology category your project genuinely requires.',
    items: [
      { title: 'Authentication', body: 'OAuth, magic links, biometrics, and session management for secure user login.', href: '/category?id=authentication&name=Authentication' },
      { title: 'Database', body: 'SQL, NoSQL, vector, and real-time databases to store and query your data.', href: '/category?id=database&name=Database' },
      { title: 'Storage', body: 'File and object storage solutions for images, videos, and user uploads.', href: '/category?id=storage&name=Storage' },
      { title: 'Video APIs', body: 'Video streaming, transcoding, live streaming, and player SDKs.', href: '/category?id=video-apis&name=Video%20APIs' },
      { title: 'CDN', body: 'Global content delivery networks for low-latency asset distribution.', href: '/category?id=cdn&name=CDN' },
      { title: 'Email', body: 'Transactional and marketing email APIs with templates and deliverability.', href: '/category?id=email&name=Email' },
      { title: 'Notifications', body: 'Push notifications, in-app messaging, and multi-channel alert systems.', href: '/category?id=notifications&name=Notifications' },
      { title: 'Analytics', body: 'Product analytics, event tracking, and user behavior insights.', href: '/category?id=analytics&name=Analytics' },
      { title: 'Hosting', body: 'Deploy and scale your frontend, backend, and serverless functions globally.', href: '/category?id=hosting&name=Hosting' },
    ],
  },
  {
    title: 'How exploration works',
    body: 'Tell StackPilot what you want to build. The AI identifies which of these categories your project needs, then recommends ranked providers for each one.',
    items: [
      { title: 'Describe your project', body: 'A YouTube clone, a SaaS dashboard, an AI chatbot — anything.', href: '/docs/search' },
      { title: 'Discover required categories', body: 'Learn how AI decides which technologies you actually need.', href: '/docs/tech-discovery' },
      { title: 'Build your stack', body: 'Compare providers and assemble your perfect tech stack.', href: '/docs/getting-started' },
    ],
  },
];

export default function ExplorePage() {
  return (
    <StaticPage
      eyebrow="Explore"
      title="Discover technologies for"
      highlight="every part of your app"
      description="Explore databases, authentication, storage, hosting, and every other layer of your stack — with ranked, production-ready providers."
      sections={sections}
    />
  );
}
