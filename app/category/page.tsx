import type { Metadata } from 'next';
import { siteConfig, absoluteUrl } from '@/lib/site';
import { getCategoryMeta } from '@/lib/categories';
import { breadcrumbSchema, serializeJsonLd } from '@/lib/jsonld';
import { providerService } from '@/lib/services/provider-service';
import { toUiProviders } from '@/lib/services/ui-providers';
import type { Provider } from '@/lib/providers';
import { CategoryView } from './category-view';

type PageProps = {
  searchParams: { id?: string; name?: string };
};

export function generateMetadata({ searchParams }: PageProps): Metadata {
  const id = searchParams.id ?? '';
  const meta = getCategoryMeta(id);
  const displayName = searchParams.name || meta.name;
  const title = `${displayName} Providers`;
  const description = `Browse and compare recommended ${displayName.toLowerCase()} providers for your stack. Ranked by popularity, reliability, production readiness, and more.`;

  return {
    title,
    description,
    alternates: {
      canonical: `/category?id=${id}`,
    },
    openGraph: {
      type: 'website',
      url: absoluteUrl(`/category?id=${id}`),
      title: `${title} — ${siteConfig.name}`,
      description,
      siteName: siteConfig.openGraph.siteName,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} — ${siteConfig.name}`,
      description,
    },
  };
}

export const dynamic = 'force-dynamic';

export default async function CategoryPage({ searchParams }: PageProps) {
  const id = searchParams.id ?? '';
  const meta = getCategoryMeta(id);
  const displayName = searchParams.name || meta.name;
  const jsonLd = breadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: displayName, url: `/category?id=${id}` },
  ]);

  let providers: Provider[] = [];
  try {
    const dbProviders = await providerService.getProvidersByCategory(id);
    providers = toUiProviders(dbProviders);
  } catch (error) {
    console.error('[category/page] Failed to load providers:', error);
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />
      <CategoryView providers={providers} categoryId={id} />
    </>
  );
}
