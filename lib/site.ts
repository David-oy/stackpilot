export type SiteConfig = {
  name: string;
  shortName: string;
  url: string;
  title: string;
  description: string;
  keywords: string[];
  creator: string;
  publisher: string;
  authors: { name: string; url?: string }[];
  category: string;
  twitterHandle: string;
  github: string;
  themeColor: { light: string; dark: string };
  openGraph: { type: 'website'; siteName: string; locale: string };
};

export const siteConfig: SiteConfig = {
  name: 'StackPilot',
  shortName: 'StackPilot',
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://get-stack.vercel.app',
  title: 'StackPilot — Discover every technology to build your BIG THING!',
  description:
    'StackPilot uses AI to analyze your project idea and recommend the best technologies, APIs, databases, authentication providers, and services. Compare providers and build your tech stack in minutes.',
  keywords: [
    'tech stack',
    'technology discovery',
    'AI stack builder',
    'recommended technologies',
    'database recommendations',
    'authentication providers',
    'API discovery',
    'cloud providers',
    'frontend frameworks',
    'backend frameworks',
    'AI tools',
    'open source tools',
    'developer tools',
    'StackPilot',
    'build a tech stack',
    'compare providers',
  ],
  creator: 'vijay peddenti',
  publisher: 'StackPilot',
  authors: [{ name: 'vijay peddenti' }],
  category: 'Technology',
  twitterHandle: '@vijayyyyy_7',
  github: 'https://github.com/David-oy/get.stack',
  themeColor: {
    light: '#f6f5fb',
    dark: '#06060a',
  },
  openGraph: {
    type: 'website',
    siteName: 'StackPilot',
    locale: 'en_US',
  },
};

export function absoluteUrl(path: string): string {
  const base = siteConfig.url.replace(/\/$/, '');
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalized}`;
}
