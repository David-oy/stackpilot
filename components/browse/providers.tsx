'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Boxes,
  ChevronRight,
  ExternalLink,
  Github,
  Loader2,
  Search,
  Scale,
  Star,
  Layers,
} from 'lucide-react';
import Link from 'next/link';
import type { ProviderWithRelations } from '@/lib/db/schema';
import { useBrowseData } from '@/hooks/use-browse-data';
import { providerCostLabel } from '@/lib/stacks/health';
import { WorkspaceShell } from '@/components/workspace/workspace-shell';
import { ProviderCompare } from '@/components/browse/provider-compare';
import { FavoriteButton } from '@/components/browse/favorite-button';
import { FilterSelect, type FilterSelectOption } from '@/components/ui/filter-select';

type SortKey = 'popularity' | 'rating' | 'cost-asc' | 'cost-desc' | 'name';

const PRICING_MODELS = [
  'all',
  'free',
  'freemium',
  'usage-based',
  'subscription',
  'per-seat',
  'open-source',
] as const;

const SORT_OPTIONS: FilterSelectOption[] = [
  { value: 'popularity', label: 'Most popular' },
  { value: 'rating', label: 'Best rated' },
  { value: 'cost-asc', label: 'Lowest cost' },
  { value: 'cost-desc', label: 'Highest cost' },
  { value: 'name', label: 'Name (A–Z)' },
];

const PAGE_SIZE = 12;

function ProviderCard({
  provider,
  categoryName,
  selected,
  onToggleSelect,
  index,
}: {
  provider: ProviderWithRelations;
  categoryName?: string;
  selected: boolean;
  onToggleSelect: () => void;
  index: number;
}) {
  const rating = provider.stack2SetRating ?? provider.communityRating;
  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.03, 0.35) }}
      className="glass glass-hover group flex flex-col rounded-2xl p-5"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-blue-500/20 ring-1 ring-foreground/10">
          <span className="text-sm font-semibold text-violet-300">{provider.name.charAt(0)}</span>
        </div>
        <div className="min-w-0 flex-1">
          <Link
            href={`/browse/providers/${provider.slug}`}
            className="block truncate text-sm font-semibold text-foreground transition-colors hover:text-violet-300"
          >
            {provider.name}
          </Link>
          {categoryName && (
            <p className="truncate text-[11px] text-muted-foreground">{categoryName}</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <FavoriteButton slug={provider.slug} categoryId={provider.categoryId} />
          <button
            type="button"
            onClick={onToggleSelect}
            aria-pressed={selected}
            title={selected ? 'Remove from comparison' : 'Add to comparison'}
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border text-xs transition-colors ${
              selected
                ? 'border-violet-500/40 bg-violet-500/15 text-violet-300'
                : 'border-foreground/5 text-muted-foreground hover:border-violet-500/20 hover:text-foreground'
            }`}
          >
            <Scale className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <p className="mt-3 line-clamp-2 min-h-[36px] text-xs leading-relaxed text-muted-foreground">
        {provider.shortDescription}
      </p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <span className="rounded-md border border-foreground/5 bg-foreground/[0.03] px-2 py-0.5 text-[10px] text-muted-foreground">
          {provider.pricingModel}
        </span>
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
        {provider.aiSuggested && (
          <span className="rounded-md border border-fuchsia-500/20 bg-fuchsia-500/10 px-2 py-0.5 text-[10px] text-fuchsia-300">
            AI suggested
          </span>
        )}
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span>Popularity</span>
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-foreground/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-500 to-blue-500"
                style={{ width: `${provider.popularityScore ?? 0}%` }}
              />
            </div>
            <span className="tabular-nums">{provider.popularityScore ?? 0}</span>
          </div>
        </div>
        {typeof rating === 'number' && (
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Rating</span>
            <span className="flex items-center gap-1 text-amber-300">
              <Star className="h-3 w-3 fill-current" />
              {rating.toFixed(1)}
            </span>
          </div>
        )}
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span>Est. monthly cost</span>
          <span className="font-medium text-foreground">{providerCostLabel(provider)}</span>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 border-t border-foreground/5 pt-4">
        {provider.officialWebsite && (
          <a
            href={provider.officialWebsite}
            target="_blank"
            rel="noreferrer"
            title="Website"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-foreground/5 text-muted-foreground transition-colors hover:text-foreground"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
        {provider.documentation && (
          <a
            href={provider.documentation}
            target="_blank"
            rel="noreferrer"
            title="Documentation"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-foreground/5 text-muted-foreground transition-colors hover:text-foreground"
          >
            <Layers className="h-3.5 w-3.5" />
          </a>
        )}
        {provider.github && (
          <a
            href={provider.github}
            target="_blank"
            rel="noreferrer"
            title="GitHub"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-foreground/5 text-muted-foreground transition-colors hover:text-foreground"
          >
            <Github className="h-3.5 w-3.5" />
          </a>
        )}
        <div className="flex-1" />
        <Link
          href={`/browse/providers/${provider.slug}`}
          className="rounded-lg bg-gradient-to-r from-violet-500 to-blue-500 px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90"
        >
          Details
        </Link>
      </div>
    </motion.article>
  );
}

function ProvidersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { providers, categories, loading, error } = useBrowseData();

  const [query, setQuery] = useState(searchParams.get('q') ?? '');
  const [category, setCategory] = useState(searchParams.get('category') ?? 'all');
  const [pricing, setPricing] = useState<string>('all');
  const [freeOnly, setFreeOnly] = useState(false);
  const [openSourceOnly, setOpenSourceOnly] = useState(false);
  const [sort, setSort] = useState<SortKey>('popularity');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [compareOpen, setCompareOpen] = useState(false);

  const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  const activeCategory = category ? categoryById.get(category) : undefined;

  const categoryParam = searchParams.get('category');

  useEffect(() => {
    setCategory(categoryParam ?? 'all');
    setPage(1);
  }, [categoryParam]);

  useEffect(() => {
    if (category !== 'all' && categories.length > 0 && !categoryById.has(category)) {
      setCategory('all');
      setPage(1);
    }
  }, [category, categories, categoryById]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    let list = providers.filter((provider) => {
      if (category !== 'all' && provider.categoryId !== category) return false;
      if (pricing !== 'all' && provider.pricingModel !== pricing) return false;
      if (freeOnly && !provider.freeTier) return false;
      if (openSourceOnly && !provider.openSource) return false;
      if (needle) {
        const haystack = [
          provider.name,
          provider.slug,
          provider.shortDescription,
          provider.longDescription,
          ...(provider.tags ?? []),
          ...(provider.features ?? []),
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(needle)) return false;
      }
      return true;
    });

    switch (sort) {
      case 'rating':
        list.sort(
          (a, b) =>
            (b.stack2SetRating ?? b.communityRating ?? 0) -
            (a.stack2SetRating ?? a.communityRating ?? 0),
        );
        break;
      case 'cost-asc':
        list.sort((a, b) => (a.monthlyCost ?? 0) - (b.monthlyCost ?? 0));
        break;
      case 'cost-desc':
        list.sort((a, b) => (b.monthlyCost ?? 0) - (a.monthlyCost ?? 0));
        break;
      case 'name':
        list.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        list.sort((a, b) => (b.popularityScore ?? 0) - (a.popularityScore ?? 0));
    }
    return list;
  }, [providers, category, pricing, freeOnly, openSourceOnly, query, sort]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const visible = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const selectedProviders = useMemo(
    () => providers.filter((provider) => selected.has(provider.slug)),
    [providers, selected],
  );

  const toggleSelect = (slug: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) {
        next.delete(slug);
      } else {
        if (next.size >= 4) next.delete(next.values().next().value as string);
        next.add(slug);
      }
      return next;
    });
  };

  const goToPage = (target: number) => {
    setPage(Math.max(1, Math.min(pageCount, target)));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <WorkspaceShell>
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="rounded-2xl glass p-6"
        >
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500/20 to-blue-500/20 ring-1 ring-violet-500/20">
              <Boxes className="h-4 w-4 text-violet-300" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Browse Providers
            </h1>
          </div>
          {activeCategory && (
            <div className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Link
                href="/browse/categories"
                className="transition-colors hover:text-foreground"
              >
                Browse Categories
              </Link>
              <ChevronRight className="h-3 w-3" />
              <span className="font-medium text-foreground">{activeCategory.name}</span>
            </div>
          )}
          <p className="mt-2 text-sm text-muted-foreground">
            {filtered.length} providers{activeCategory ? ` in ${activeCategory.name}` : ' in our database'}
            . Select 2–4 to compare side by side.
          </p>

          <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
                placeholder="Search providers..."
                aria-label="Search providers"
                className="h-10 w-full rounded-lg border border-foreground/5 bg-foreground/[0.02] pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-violet-500/30 focus:outline-none lg:w-64"
              />
            </label>
            <FilterSelect
              value={category}
              onChange={(value) => {
                setCategory(value);
                setPage(1);
              }}
              aria-label="Filter by category"
              options={[
                { value: 'all', label: 'All categories' },
                ...categories.map((c) => ({ value: c.id, label: c.name })),
              ]}
            />
            <FilterSelect
              value={pricing}
              onChange={(value) => {
                setPricing(value);
                setPage(1);
              }}
              aria-label="Filter by pricing model"
              options={PRICING_MODELS.map((model) => ({
                value: model,
                label: model === 'all' ? 'All pricing' : model,
              }))}
            />
            <FilterSelect
              value={sort}
              onChange={(value) => {
                setSort(value as SortKey);
                setPage(1);
              }}
              aria-label="Sort providers"
              options={SORT_OPTIONS}
            />
            <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={freeOnly}
                onChange={(e) => {
                  setFreeOnly(e.target.checked);
                  setPage(1);
                }}
                className="h-3.5 w-3.5 rounded border-foreground/20 bg-transparent accent-violet-500"
              />
              Free tier only
            </label>
            <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={openSourceOnly}
                onChange={(e) => {
                  setOpenSourceOnly(e.target.checked);
                  setPage(1);
                }}
                className="h-3.5 w-3.5 rounded border-foreground/20 bg-transparent accent-violet-500"
              />
              Open source only
            </label>
          </div>
        </motion.div>

        {loading ? (
          <div className="flex items-center justify-center rounded-2xl glass py-24">
            <Loader2 className="h-6 w-6 animate-spin text-violet-400" />
          </div>
        ) : error ? (
          <div className="rounded-2xl glass py-16 text-center text-sm text-muted-foreground">
            {error}
          </div>
        ) : visible.length === 0 ? (
          <div className="rounded-2xl glass py-16 text-center text-sm text-muted-foreground">
            No providers match your filters.
          </div>
        ) : (
          <>
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {visible.map((provider, i) => (
                <ProviderCard
                  key={provider.slug}
                  provider={provider}
                  categoryName={categoryById.get(provider.categoryId)?.name}
                  selected={selected.has(provider.slug)}
                  onToggleSelect={() => toggleSelect(provider.slug)}
                  index={i}
                />
              ))}
            </div>

            {pageCount > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => goToPage(safePage - 1)}
                  disabled={safePage <= 1}
                  className="h-9 rounded-lg border border-foreground/5 bg-foreground/[0.02] px-3 text-sm text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="px-3 text-xs text-muted-foreground">
                  Page {safePage} of {pageCount}
                </span>
                <button
                  type="button"
                  onClick={() => goToPage(safePage + 1)}
                  disabled={safePage >= pageCount}
                  className="h-9 rounded-lg border border-foreground/5 bg-foreground/[0.02] px-3 text-sm text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {selected.size >= 2 && (
        <div className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2">
          <button
            type="button"
            onClick={() => setCompareOpen(true)}
            className="flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-500 to-blue-500 px-6 py-3 text-sm font-medium text-white shadow-xl shadow-violet-500/30 transition-transform hover:scale-105"
          >
            <Scale className="h-4 w-4" />
            Compare ({selected.size})
            <button
              type="button"
              aria-label="Clear comparison"
              onClick={(e) => {
                e.stopPropagation();
                setSelected(new Set());
              }}
              className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-xs hover:bg-white/30"
            >
              ×
            </button>
          </button>
        </div>
      )}

      <ProviderCompare
        open={compareOpen}
        onOpenChange={setCompareOpen}
        providers={selectedProviders}
        categoryById={categoryById}
      />
    </WorkspaceShell>
  );
}

export function BrowseProviders() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Search className="h-5 w-5 animate-spin" />
            <span className="text-sm">Loading providers...</span>
          </div>
        </div>
      }
    >
      <ProvidersContent />
    </Suspense>
  );
}
