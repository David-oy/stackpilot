import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'StackPilot — Discover every technology to build your next project',
  description:
    'StackPilot helps developers discover all the technologies they need to build a project — APIs, databases, authentication providers, storage, AI models, hosting, payments, and more.',
  openGraph: {
    title: 'StackPilot — Discover every technology to build your next project',
    description:
      'Describe your project. Let AI identify the required technology categories. Choose providers and build your tech stack.',
    images: [{ url: 'https://bolt.new/static/og_default.png' }],
  },
  twitter: {
    card: 'summary_large_image',
    images: [{ url: 'https://bolt.new/static/og_default.png' }],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
