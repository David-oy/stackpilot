'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Search, Sparkles, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { categories } from '@/lib/categories';
import { RecommendedStack } from '@/components/landing/recommended-stack';

function ResultsContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || 'your project';

  return (
    <main className="relative min-h-screen overflow-x-hidden pt-20">
      <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[400px] w-[700px] -translate-x-1/2 rounded-full bg-violet-600/10 blur-[120px]" />

      <div className="mx-auto max-w-7xl px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            New search
          </Link>

          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-xs text-muted-foreground">
                <Sparkles className="h-3 w-3 text-violet-400" />
                <span>AI analysis complete</span>
              </div>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Tech stack for <span className="gradient-text">{query}</span>
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                We identified {categories.length} technology categories for your project.
              </p>
            </div>
          </div>
        </motion.div>

        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          <div>
            <div className="grid gap-5 sm:grid-cols-2">
              {categories.map((cat, i) => (
                <motion.div
                  key={cat.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.06 }}
                  className="glass glass-hover group rounded-2xl p-6"
                >
                  <div className="flex items-start justify-between">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${cat.gradient} ring-1 ring-white/10 transition-transform group-hover:scale-110`}
                    >
                      <cat.icon className={`h-6 w-6 ${cat.iconColor}`} />
                    </div>
                    <span className="rounded-full border border-white/5 bg-white/[0.03] px-2.5 py-1 text-xs text-muted-foreground">
                      {cat.providers} providers
                    </span>
                  </div>

                  <h3 className="mt-5 text-lg font-semibold text-white">{cat.name}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {cat.description}
                  </p>

                  <button className="mt-5 flex w-full items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-4 py-2.5 text-sm text-muted-foreground transition-all hover:border-violet-500/20 hover:bg-white/[0.04] hover:text-white">
                    Explore Providers
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </button>
                </motion.div>
              ))}
            </div>
          </div>

          <div>
            <RecommendedStack />
          </div>
        </div>
      </div>
    </main>
  );
}

export default function ResultsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#06060a]">
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
