import type { Metadata } from 'next';
import { Navbar } from '@/components/landing/navbar';
import { Footer } from '@/components/landing/footer';
import { DocsSidebar } from '@/components/docs/docs-sidebar';
import { DocsMobileNav } from '@/components/docs/docs-mobile-nav';
import { siteConfig } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Documentation',
  description:
    'Learn how to use Stack2Set: describe your project, review AI-recommended technology categories, compare providers, and build your tech stack.',
  alternates: {
    canonical: '/docs',
  },
};

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen pt-16">
      <Navbar />
      <DocsMobileNav />
      <div className="mx-auto flex w-full max-w-7xl gap-8 px-4 sm:px-6">
        <DocsSidebar />
        <main className="min-w-0 flex-1 py-10 lg:py-14">{children}</main>
      </div>
      <Footer />
    </div>
  );
}
