import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { SharePayload } from '@/lib/stacks/types';
import { getShareRepository } from '@/lib/stacks/share';
import { siteConfig, absoluteUrl } from '@/lib/site';
import { ShareView } from './view';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function fetchShare(id: string): SharePayload | null {
  try {
    return getShareRepository().get(id);
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const share = fetchShare(params.id);
  if (!share) return { title: 'Stack not found' };

  const url = absoluteUrl(`/stack/${params.id}`);
  const providerCount = share.categories.reduce((sum, c) => sum + c.providers.length, 0);
  const description = [
    share.prompt,
    share.summary,
    `${share.categories.length} categories · ${providerCount} providers · ${share.complexity ?? ''} complexity`.trim(),
    `Est. monthly cost ${share.estimatedMonthlyCost === 0 ? 'free' : `$${share.estimatedMonthlyCost}/mo`}`,
  ]
    .filter(Boolean)
    .join(' — ');

  return {
    title: share.name,
    description,
    alternates: { canonical: `/stack/${params.id}` },
    openGraph: {
      type: 'website',
      url,
      siteName: siteConfig.openGraph.siteName,
      title: `${share.name} — ${siteConfig.name}`,
      description,
      images: [{ url: '/og.svg', width: 1200, height: 630, alt: share.name }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${share.name} — ${siteConfig.name}`,
      description,
      creator: siteConfig.twitterHandle,
      images: ['/og.svg'],
    },
  };
}

export default async function SharePage({ params }: { params: { id: string } }) {
  const share = fetchShare(params.id);
  if (!share) notFound();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: share.name,
    description: share.prompt || share.summary || `Technology stack with ${share.categories.length} categories.`,
    url: absoluteUrl(`/stack/${params.id}`),
    publisher: { '@type': 'Organization', name: siteConfig.name },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ShareView share={share} id={params.id} />
    </>
  );
}
