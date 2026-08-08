import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Boxes, ChevronRight, Search, Star } from 'lucide-react';
import { providerService } from '@/lib/services/provider-service';
import type { ProviderWithRelations } from '@/lib/db/schema';
import { siteConfig, absoluteUrl } from '@/lib/site';
import { breadcrumbSchema, itemListSchema, serializeJsonLd } from '@/lib/jsonld';
import { categoryIcon } from '@/lib/browse/category-icons';
import { WorkspaceShell } from '@/components/workspace/workspace-shell';
import { providerCostLabel } from '@/lib/stacks/health';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type PageProps = { params: Promise<{ slug: string }> };

function categoryDescription(categoryName: string, rawDescription: string): string {
  if (rawDescription) {
    return `${rawDescription} Compare and pick the best ${categoryName.toLowerCase()} provider for your tech stack.`;
  }
  return `Compare the best ${categoryName.toLowerCase()} providers for your tech stack, ranked by popularity, reliability, and production readiness.`;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await providerService.getCategoryBySlug(slug);
  if (!category) {
    return { title: 'Category not found' };
  }
  const canonical = `/browse/categories/${category.slug}`;
  const title = `${category.name} Providers`;
  const description = categoryDescription(category.name, category.description);

  return {
    title,
    description,
    alternates: { canonical },
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      type: 'website',
      url: absoluteUrl(canonical),
      title,
      description,
      siteName: siteConfig.openGraph.siteName,
      locale: siteConfig.openGraph.locale,
      images: [{ url: absoluteUrl('/og.svg'), width: 1200, height: 630, alt: siteConfig.name }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [absoluteUrl('/og.svg')],
    },
  };
}

function ProviderLink({ provider }: { provider: ProviderWithRelations }) {
  const rating = provider.stack2SetRating ?? provider.communityRating;
  return (
    <Link
      href={`/browse/providers/${provider.slug}`}
      className="glass glass-hover group flex flex-col rounded-2xl p-5 transition-colors hover:border-teal-500/25"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500/20 to-cyan-500/20 ring-1 ring-foreground/10">
          <span className="text-sm font-semibold text-teal-300">
            {provider.name.charAt(0)}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground transition-colors group-hover:text-teal-300">
            {provider.name}
          </p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">{provider.pricingModel}</p>
        </div>
      </div>

      <p className="mt-3 line-clamp-2 min-h-[36px] text-xs leading-relaxed text-muted-foreground">
        {provider.shortDescription}
      </p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {provider.freeTier && (
          <span className="rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-300">
            Free tier
          </span>
        )}
        {provider.openSource && (
          <span className="rounded-md border border-blue-500/20 bg-blue-500/10 px-2 py-0.5 text-[10px] text-blue-300">
            Open source
          </span>
        )}
        {(provider.tags ?? []).slice(0, 3).map((tag) => (
          <span
            key={tag}
            className="rounded-md border border-foreground/5 bg-foreground/[0.03] px-2 py-0.5 text-[10px] text-muted-foreground"
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span>Popularity</span>
          <span className="flex items-center gap-1 tabular-nums">
            <Star className="h-3 w-3 text-amber-300" />
            {provider.popularityScore ?? 0}
          </span>
        </div>
        {typeof rating === 'number' && (
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Rating</span>
            <span className="text-amber-300">{rating.toFixed(1)}/5</span>
          </div>
        )}
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span>Est. monthly cost</span>
          <span className="font-medium text-foreground">{providerCostLabel(provider)}</span>
        </div>
      </div>
    </Link>
  );
}

export default async function BrowseCategoryPage({ params }: PageProps) {
  const { slug } = await params;
  const category = await providerService.getCategoryBySlug(slug);
  if (!category) notFound();

  const providers = (await providerService.getProvidersByCategory(slug)).filter(
    (p) => p.status === 'active',
  );
  const Icon = categoryIcon(category.icon);
  const canonical = `/browse/categories/${category.slug}`;
  const title = `${category.name} Providers`;

  const jsonLd = [
    breadcrumbSchema([
      { name: 'Home', url: '/' },
      { name: 'Browse Categories', url: '/browse/categories' },
      { name: title, url: canonical },
    ]),
    itemListSchema(providers, title),
  ];

  return (
    <WorkspaceShell>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />
      <div className="space-y-6">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Link href="/" className="transition-colors hover:text-foreground">
            Home
          </Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/browse/categories" className="transition-colors hover:text-foreground">
            Browse Categories
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-medium text-foreground">{category.name}</span>
        </nav>

        <div className="rounded-2xl glass p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500/20 to-cyan-500/20 ring-1 ring-foreground/10">
              <Icon className="h-7 w-7 text-teal-300" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                {title}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                {category.description || categoryDescription(category.name, '')}
              </p>
              <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Boxes className="h-3.5 w-3.5" />
                {providers.length} providers available for your project
              </p>
            </div>
          </div>
        </div>

        {providers.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl glass py-16 text-center">
            <Search className="h-8 w-8 text-muted-foreground/50" />
            <p className="mt-3 text-sm text-muted-foreground">No providers found in this category.</p>
            <Link
              href="/browse/categories"
              className="mt-4 text-sm text-teal-400 transition-colors hover:text-teal-300"
            >
              Browse all categories
            </Link>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {providers.map((provider) => (
              <ProviderLink key={provider.slug} provider={provider} />
            ))}
          </div>
        )}
      </div>
    </WorkspaceShell>
  );
}
