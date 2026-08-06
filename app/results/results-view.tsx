'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Search,
  Sparkles,
  ArrowRight,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Type,
} from 'lucide-react';
import Link from 'next/link';
import { getCategoryMeta } from '@/lib/categories';
import { RecommendedStack } from '@/components/landing/recommended-stack';
import { CurrentStack } from '@/components/landing/current-stack';
import { useStack } from '@/lib/stack-context';
import { useAnalysis } from '@/hooks/use-analysis';
import type { Complexity } from '@/lib/types';

const complexityStyles: Record<Complexity, string> = {
  Low: 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/20',
  Medium: 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/20',
  High: 'bg-rose-500/15 text-rose-300 ring-1 ring-rose-500/20',
};

function LoadingState() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-6">
      <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[400px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-600/10 blur-[120px]" />
      <div className="flex flex-col items-center text-center">
        <div className="relative mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-blue-500">
          <Loader2 className="h-7 w-7 animate-spin text-white" />
        </div>
        <h2 className="text-xl font-semibold text-foreground">Analyzing your project</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Contacting the AI to identify your technology stack...
        </p>
      </div>
    </main>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-6">
      <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[400px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-600/10 blur-[120px]" />
      <div className="glass w-full max-w-md rounded-2xl p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/15 ring-1 ring-rose-500/30">
          <AlertTriangle className="h-6 w-6 text-rose-400" />
        </div>
        <h2 className="mt-4 text-lg font-semibold text-foreground">Analysis failed</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{message}</p>
        <div className="mt-6 flex flex-col items-center gap-3">
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-violet-500 to-blue-500 px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            <RefreshCw className="h-4 w-4" />
            Try again
          </button>
          <Link href="/" className="text-sm text-violet-400 transition-colors hover:text-violet-300">
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}

function ResultsContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || 'your project';
  const { data: analysis, isLoading, error, retry } = useAnalysis(query);
  const { activeStack, hydrated } = useStack();

  if (isLoading) {
    return <LoadingState />;
  }

  if (error || !analysis) {
    return <ErrorState message={error ?? 'No analysis available for this project.'} onRetry={retry} />;
  }

  return (
    <main className="relative min-h-screen overflow-x-hidden pt-20">
      <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[400px] w-[700px] -translate-x-1/2 rounded-full bg-violet-600/10 blur-[120px]" />

      <div className="mx-auto max-w-7xl px-6 py-8">
        <header className="mb-8">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <nav aria-label="Breadcrumb">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                New search
              </Link>
            </nav>

            <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-xs text-muted-foreground">
                    <Sparkles className="h-3 w-3 text-violet-400" />
                    <span>AI analysis complete</span>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-500/15 px-3 py-1 text-xs font-medium text-violet-300 ring-1 ring-violet-500/20">
                    <Type className="h-3 w-3" />
                    {analysis.projectType}
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${complexityStyles[analysis.complexity]}`}
                  >
                    {analysis.complexity} complexity
                  </span>
                </div>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                  Tech stack for <span className="gradient-text">{query}</span>
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                  {analysis.summary}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  We identified {analysis.categories.length} technology categories for your project.
                </p>
              </div>
            </div>
          </motion.div>
        </header>

        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          <div>
            <div className="grid gap-5 sm:grid-cols-2">
              {analysis.categories.map((cat, i) => {
                const meta = getCategoryMeta(cat.id);
                const categoryHref = `/category?id=${cat.id}&name=${encodeURIComponent(cat.name)}`;
                return (
                  <motion.article
                    key={cat.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: i * 0.06 }}
                    className="glass glass-hover group rounded-2xl p-6"
                  >
                    <div className="flex items-start justify-between">
                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${meta.gradient} ring-1 ring-foreground/10 transition-transform group-hover:scale-110`}
                      >
                        <meta.icon className={`h-6 w-6 ${meta.iconColor}`} />
                      </div>
                      <span className="rounded-full border border-foreground/5 bg-foreground/[0.03] px-2.5 py-1 text-xs text-muted-foreground">
                        {cat.providers.length} providers
                      </span>
                    </div>

                    <h3 className="mt-5 text-lg font-semibold text-foreground">{cat.name}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {cat.description}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {cat.providers.map((provider) => (
                        <span
                          key={provider.id}
                          title={provider.reason}
                          className="rounded-md border border-foreground/5 bg-foreground/[0.03] px-2 py-1 text-[11px] text-muted-foreground"
                        >
                          {provider.name}
                        </span>
                      ))}
                    </div>

                    <a
                      href={categoryHref}
                      className="mt-5 flex w-full items-center justify-between rounded-lg border border-foreground/5 bg-foreground/[0.02] px-4 py-2.5 text-sm text-muted-foreground transition-all hover:border-violet-500/20 hover:bg-foreground/[0.04] hover:text-foreground"
                    >
                      Explore Providers
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </a>
                  </motion.article>
                );
              })}
            </div>
          </div>

          <div className="space-y-8">
            <RecommendedStack analysis={analysis} />
            {hydrated && activeStack && <CurrentStack />}
          </div>
        </div>
      </div>
    </main>
  );
}

export function ResultsView() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Search className="h-5 w-5 animate-spin" />
            <span className="text-sm">Loading results...</span>
          </div>
        </div>
      }
    >
      <ResultsContent />
    </Suspense>
  );
}
