'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Search, LayoutGrid, ArrowRight, Loader2, Boxes } from 'lucide-react';
import type { CategoryRecord, ProviderWithRelations } from '@/lib/db/schema';
import { useBrowseData } from '@/hooks/use-browse-data';
import { categoryIcon, categoryVisual } from '@/lib/browse/category-icons';
import { WorkspaceShell } from '@/components/workspace/workspace-shell';
import { FilterSelect, type FilterSelectOption } from '@/components/ui/filter-select';

type SortKey = 'name' | 'providers' | 'popularity' | 'updated';

const SORT_OPTIONS: FilterSelectOption[] = [
  { value: 'name', label: 'Name (A–Z)' },
  { value: 'providers', label: 'Most providers' },
  { value: 'popularity', label: 'Most popular' },
  { value: 'updated', label: 'Recently updated' },
];

type CategoryStats = CategoryRecord & {
  providerCount: number;
  avgPopularity: number;
  lastUpdated: string;
};

function buildStats(
  categories: CategoryRecord[],
  providers: ProviderWithRelations[],
): CategoryStats[] {
  const byCategory = new Map<string, ProviderWithRelations[]>();
  for (const provider of providers) {
    const list = byCategory.get(provider.categoryId) ?? [];
    list.push(provider);
    byCategory.set(provider.categoryId, list);
  }
  return categories.map((category) => {
    const list = byCategory.get(category.id) ?? [];
    const avgPopularity = list.length
      ? Math.round(list.reduce((sum, p) => sum + (p.popularityScore ?? 0), 0) / list.length)
      : 0;
    const lastUpdated = list.reduce(
      (max, p) => (p.updatedAt > max ? p.updatedAt : max),
      category.updatedAt,
    );
    return { ...category, providerCount: list.length, avgPopularity, lastUpdated };
  });
}

function timeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function BrowseCategories() {
  const { categories, providers, loading, error } = useBrowseData();
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortKey>('name');

  const stats = useMemo(() => buildStats(categories, providers), [categories, providers]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    let list = stats;
    if (needle) {
      list = list.filter((category) =>
        [category.name, category.slug, category.description, ...(category.aliases ?? [])]
          .join(' ')
          .toLowerCase()
          .includes(needle),
      );
    }
    const sorted = [...list];
    switch (sort) {
      case 'providers':
        sorted.sort((a, b) => b.providerCount - a.providerCount || a.name.localeCompare(b.name));
        break;
      case 'popularity':
        sorted.sort((a, b) => b.avgPopularity - a.avgPopularity || a.name.localeCompare(b.name));
        break;
      case 'updated':
        sorted.sort((a, b) => b.lastUpdated.localeCompare(a.lastUpdated));
        break;
      default:
        sorted.sort((a, b) => a.name.localeCompare(b.name));
    }
    return sorted;
  }, [stats, query, sort]);

  return (
    <WorkspaceShell>
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="rounded-2xl glass p-6"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500/20 to-blue-500/20 ring-1 ring-violet-500/20">
                  <LayoutGrid className="h-4 w-4 text-violet-300" />
                </div>
                <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                  Browse Categories
                </h1>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Explore {stats.length} technology categories. Each one maps to a curated set of
                providers in our database.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <label className="relative block">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search categories..."
                  aria-label="Search categories"
                  className="h-10 w-full rounded-lg border border-foreground/5 bg-foreground/[0.02] pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-violet-500/30 focus:outline-none sm:w-64"
                />
              </label>
              <FilterSelect
                value={sort}
                onChange={(value) => setSort(value as SortKey)}
                aria-label="Sort categories"
                options={SORT_OPTIONS}
              />
            </div>
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
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl glass py-16 text-center text-sm text-muted-foreground">
            No categories match your search.
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((category, i) => {
              const Icon = categoryIcon(category.icon);
              const visual = categoryVisual(i);
              return (
                <motion.article
                  key={category.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: Math.min(i * 0.04, 0.4) }}
                  className="glass glass-hover group rounded-2xl p-6"
                >
                  <div className="flex items-start justify-between">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${visual.gradient} ring-1 ring-foreground/10 transition-transform group-hover:scale-110`}
                    >
                      <Icon className={`h-6 w-6 ${visual.iconColor}`} />
                    </div>
                    <div className="flex items-center gap-1.5 rounded-full border border-foreground/5 bg-foreground/[0.03] px-2.5 py-1 text-xs text-muted-foreground">
                      <Boxes className="h-3 w-3" />
                      {category.providerCount} providers
                    </div>
                  </div>

                  <h2 className="mt-5 text-lg font-semibold text-foreground">{category.name}</h2>
                  <p className="mt-2 min-h-[40px] text-sm leading-relaxed text-muted-foreground">
                    {category.description}
                  </p>

                  <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
                    {category.avgPopularity > 0 && (
                      <span>Popularity {category.avgPopularity}/100</span>
                    )}
                    <span>Updated {timeAgo(category.lastUpdated)}</span>
                  </div>

                  <Link
                    href={`/browse/providers?category=${encodeURIComponent(category.slug)}`}
                    className="mt-5 flex w-full items-center justify-between rounded-lg border border-foreground/5 bg-foreground/[0.02] px-4 py-2.5 text-sm text-muted-foreground transition-all hover:border-violet-500/20 hover:bg-foreground/[0.04] hover:text-foreground"
                  >
                    Browse providers
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </motion.article>
              );
            })}
          </div>
        )}
      </div>
    </WorkspaceShell>
  );
}
