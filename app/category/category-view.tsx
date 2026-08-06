'use client';

import { useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Search, Check, Plus, Info, SlidersHorizontal } from 'lucide-react';
import Link from 'next/link';
import { getCategoryMeta } from '@/lib/categories';
import { providersByCategory, type Provider } from '@/lib/providers';
import type { AnalysisProvider } from '@/lib/types';
import { CurrentStack } from '@/components/landing/current-stack';
import { useStack } from '@/lib/stack-context';
import { useAnalysisContext } from '@/lib/analysis-context';

type FilterKey = 'freeTier' | 'openSource' | 'paid' | 'beginnerFriendly' | 'popular';

const filterOptions: { key: FilterKey; label: string }[] = [
  { key: 'freeTier', label: 'Free Tier' },
  { key: 'openSource', label: 'Open Source' },
  { key: 'paid', label: 'Paid' },
  { key: 'beginnerFriendly', label: 'Beginner Friendly' },
  { key: 'popular', label: 'Most Popular' },
];

const aiProviderGradients = [
  'from-violet-500 to-purple-500',
  'from-blue-500 to-cyan-500',
  'from-emerald-500 to-teal-500',
  'from-amber-500 to-orange-500',
  'from-pink-500 to-rose-500',
];

function toProvider(ap: AnalysisProvider, index: number): Provider {
  return {
    id: ap.id,
    name: ap.name,
    description: ap.description || ap.reason || '',
    tags: [],
    freeTier: false,
    openSource: false,
    paid: false,
    beginnerFriendly: false,
    popular: false,
    logoColor: aiProviderGradients[index % aiProviderGradients.length],
    logoText: ap.name.charAt(0).toUpperCase(),
  };
}

function ProviderCard({ provider, categoryId, index }: { provider: Provider; categoryId: string; index: number }) {
  const { stack, addToStack, removeFromStack } = useStack();
  const inStack = stack[categoryId]?.providerId === provider.id;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="glass glass-hover rounded-2xl p-6"
    >
      <div className="flex items-start gap-4">
        <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${provider.logoColor} text-xl font-bold text-white shadow-lg`}>
          {provider.logoText}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold text-foreground">{provider.name}</h3>
            {provider.popular && (
              <span className="flex items-center gap-1 rounded-full bg-violet-500/15 px-2 py-0.5 text-[10px] font-medium text-violet-300 ring-1 ring-violet-500/20">
                <span className="h-1 w-1 rounded-full bg-violet-400" />
                Popular
              </span>
            )}
            {provider.freeTier && (
              <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-300 ring-1 ring-emerald-500/20">
                Free Tier
              </span>
            )}
          </div>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{provider.description}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {provider.tags.map((tag) => (
          <span key={tag} className="rounded-md border border-foreground/5 bg-foreground/[0.03] px-2 py-1 text-[11px] text-muted-foreground">
            {tag}
          </span>
        ))}
      </div>

      <div className="mt-5 flex gap-2">
        <button className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-foreground/5 bg-foreground/[0.02] py-2.5 text-sm text-muted-foreground transition-all hover:border-violet-500/20 hover:bg-foreground/[0.04] hover:text-foreground">
          <Info className="h-4 w-4" />
          View Details
        </button>
        <button
          onClick={() =>
            inStack ? removeFromStack(categoryId) : addToStack(categoryId, provider.id, provider.name)
          }
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2.5 text-sm font-medium transition-all ${
            inStack
              ? 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30 hover:bg-emerald-500/20'
              : 'bg-gradient-to-r from-violet-500 to-blue-500 text-white hover:from-violet-600 hover:to-blue-600'
          }`}
        >
          {inStack ? (
            <>
              <Check className="h-4 w-4" />
              In Stack
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              Add to Stack
            </>
          )}
        </button>
      </div>
    </motion.article>
  );
}

function CategoryContent({ initialProviders }: { initialProviders?: Provider[] }) {
  const searchParams = useSearchParams();
  const categoryId = searchParams.get('id') ?? '';
  const categoryName = searchParams.get('name');
  const category = getCategoryMeta(categoryId);
  const displayName = categoryName || category.name;
  const { query: analysisQuery, analysis } = useAnalysisContext();
  const aiCategory = analysis?.categories.find((c) => c.id === categoryId);
  const staticProviders = useMemo(
    () => (categoryId ? providersByCategory[categoryId] ?? [] : []),
    [categoryId],
  );
  const aiProviders = useMemo(
    () => (aiCategory?.providers ?? []).map((p, i) => toProvider(p, i)),
    [aiCategory],
  );
  const providers =
    initialProviders && initialProviders.length > 0
      ? initialProviders
      : staticProviders.length > 0
        ? staticProviders
        : aiProviders;
  const hasProviders = providers.length > 0;

  const [search, setSearch] = useState('');
  const [activeFilters, setActiveFilters] = useState<Set<FilterKey>>(new Set());

  const toggleFilter = (key: FilterKey) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const filtered = useMemo(() => {
    return providers.filter((p) => {
      const matchesSearch =
        !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.description.toLowerCase().includes(search.toLowerCase()) ||
        p.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));
      const matchesFilters =
        activeFilters.size === 0 || Array.from(activeFilters).every((f) => p[f]);
      return matchesSearch && matchesFilters;
    });
  }, [providers, search, activeFilters]);

  return (
    <main className="relative min-h-screen overflow-x-hidden pt-20">
      <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[400px] w-[700px] -translate-x-1/2 rounded-full bg-violet-600/10 blur-[120px]" />

      <div className="mx-auto max-w-7xl px-6 py-8">
        <header>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <nav aria-label="Breadcrumb">
              <Link
                href={`/results?q=${encodeURIComponent(analysisQuery ?? 'your project')}`}
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to categories
              </Link>
            </nav>

            <div className="mt-6 flex items-center gap-4">
              <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${category.gradient} ring-1 ring-foreground/10`}>
                <category.icon className={`h-7 w-7 ${category.iconColor}`} />
              </div>
              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                  {displayName} Providers
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {providers.length} providers available for your project
                </p>
              </div>
            </div>
          </motion.div>
        </header>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="mb-6 space-y-4"
            >
              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search providers..."
                  className="w-full rounded-xl glass py-3 pl-11 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-violet-500/30"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  Filter by:
                </div>
                {filterOptions.map((opt) => {
                  const active = activeFilters.has(opt.key);
                  return (
                    <button
                      key={opt.key}
                      onClick={() => toggleFilter(opt.key)}
                      className={`rounded-full px-3 py-1.5 text-xs transition-all ${
                        active
                          ? 'bg-gradient-to-r from-violet-500 to-blue-500 text-white'
                          : 'glass text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </motion.div>

            <motion.div layout className="grid gap-5 sm:grid-cols-2">
              <AnimatePresence mode="popLayout">
                {filtered.map((provider, i) => (
                  <ProviderCard key={provider.id} provider={provider} categoryId={categoryId} index={i} />
                ))}
              </AnimatePresence>
            </motion.div>

            {!hasProviders ? (
              <div className="flex flex-col items-center justify-center rounded-2xl glass py-16 text-center">
                <Search className="h-8 w-8 text-muted-foreground/50" />
                <p className="mt-3 text-sm text-muted-foreground">No providers found.</p>
              </div>
            ) : (
              filtered.length === 0 && (
                <div className="flex flex-col items-center justify-center rounded-2xl glass py-16 text-center">
                  <Search className="h-8 w-8 text-muted-foreground/50" />
                  <p className="mt-3 text-sm text-muted-foreground">No providers match your filters.</p>
                  <button
                    onClick={() => {
                      setActiveFilters(new Set());
                      setSearch('');
                    }}
                    className="mt-4 text-sm text-violet-400 hover:text-violet-300"
                  >
                    Clear all filters
                  </button>
                </div>
              )
            )}
          </div>

          <div>
            <CurrentStack />
          </div>
        </div>
      </div>
    </main>
  );
}

export function CategoryView({
  providers,
  categoryId: _categoryId,
}: {
  providers?: Provider[];
  categoryId?: string;
}) {
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
      <CategoryContent initialProviders={providers} />
    </Suspense>
  );
}
