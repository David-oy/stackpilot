'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useEffect, useRef, useState } from 'react';
import {
  Search,
  Sparkles,
  ArrowLeft,
  AlertTriangle,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { LoadingScreen } from '@/components/landing/loading-screen';
import { SearchBar } from '@/components/search/search-bar';
import { RecentSearches } from '@/components/search/recent-searches';
import { AuthModal } from '@/components/auth/auth-modal';
import { useAuth } from '@/lib/auth/auth-context';
import { useAnalysis } from '@/hooks/use-analysis';
import { useProjectSearch } from '@/hooks/use-project-search';
import { useStack } from '@/lib/stack-context';
import { clearPendingQuery, getPendingQuery } from '@/lib/auth/pending-query';

const SUGGESTIONS = [
  'I want to build a video streaming platform like Netflix',
  'A SaaS dashboard with AI chat for customer support',
  'A food delivery app with realtime order tracking',
  'A marketplace for vintage video games',
  'A realtime multiplayer fitness tracking app',
  'An AI-powered resume builder',
];

function ErrorState({
  message,
  onRetry,
  notProject = false,
  onSearch,
}: {
  message: string;
  onRetry: () => void;
  notProject?: boolean;
  onSearch?: (query: string) => void;
}) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-6">
      <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[400px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-teal-500/10 blur-[120px]" />
      <div className="glass w-full max-w-md rounded-2xl p-8 text-center">
        <div
          className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${
            notProject
              ? 'bg-amber-500/15 ring-1 ring-amber-500/30'
              : 'bg-rose-500/15 ring-1 ring-rose-500/30'
          }`}
        >
          <AlertTriangle className={`h-6 w-6 ${notProject ? 'text-amber-400' : 'text-rose-400'}`} />
        </div>
        <h2 className="mt-4 text-lg font-semibold text-foreground">
          {notProject ? 'Couldn\u2019t understand that.' : 'Analysis failed'}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {notProject
            ? 'Tell me what you\u2019re trying to build and I\u2019ll identify the technology stack.'
            : message}
        </p>
        {notProject && onSearch && (
          <div className="mt-6 text-left">
            <SearchBar
              onSearch={onSearch}
              placeholder="Try describing your idea differently..."
            />
          </div>
        )}
        <div className="mt-6 flex flex-col items-center gap-3">
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 rounded-lg bg-teal-500 px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            <RefreshCw className="h-4 w-4" />
            Try again
          </button>
          <Link href="/" className="text-sm text-teal-400 transition-colors hover:text-teal-300">
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}

function SignInPrompt({
  query,
  onOpenAuth,
}: {
  query: string;
  onOpenAuth: () => void;
}) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-6">
      <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[400px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-teal-500/10 blur-[120px]" />
      <div className="glass w-full max-w-lg rounded-2xl p-8 text-center sm:p-10">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-teal-500/15 ring-1 ring-teal-500/20">
          <Sparkles className="h-6 w-6 text-teal-400" />
        </div>
        <h2 className="mt-4 text-lg font-semibold text-foreground sm:text-xl">
          Sign in to build your stack
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          We saved <span className="font-medium text-foreground">&ldquo;{query}&rdquo;</span>.
          Create a free account and we&apos;ll continue right where you left off — no need to search
          again.
        </p>
        <button
          onClick={onOpenAuth}
          className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-teal-500 px-6 text-sm font-medium text-white shadow-lg shadow-teal-500/25 transition-all hover:bg-teal-600"
        >
          <Sparkles className="h-4 w-4" />
          Create a free account to continue your search
        </button>
      </div>
    </main>
  );
}

function SearchHome({ onSearch }: { onSearch: (query: string) => void }) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-6">
      <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[500px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-teal-500/10 blur-[120px]" />
      <div className="w-full max-w-2xl py-16">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center"
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-xs text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-teal-400" />
            <span>AI-powered tech stack discovery</span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            What do you want to <span className="gradient-text">build?</span>
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Describe your project and we&apos;ll research the best providers and build your stack.
          </p>
        </motion.div>

        <div className="mt-8">
          <SearchBar onSearch={onSearch} autoFocus />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="mt-10"
        >
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Try something like
          </p>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => onSearch(suggestion)}
                className="rounded-full border border-foreground/5 bg-foreground/[0.02] px-3 py-1.5 text-xs text-muted-foreground transition-all hover:border-teal-500/25 hover:text-foreground"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </motion.div>

        <div className="mx-auto mt-10 max-w-md">
          <RecentSearches />
        </div>
      </div>
    </main>
  );
}

function SearchPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlQuery = (searchParams.get('q') ?? '').trim();
  const { user, loading: authLoading } = useAuth();
  const { handleSearch, authOpen, setAuthOpen, attemptedQuery } = useProjectSearch();
  const { createStackFromAnalysis, stacks, setActiveStackId } = useStack();

  const [query, setQuery] = useState(urlQuery);
  const [pendingResolved, setPendingResolved] = useState(false);
  const builtStackFor = useRef<string | null>(null);

  useEffect(() => {
    if (urlQuery) {
      clearPendingQuery();
      setQuery(urlQuery);
      setPendingResolved(true);
      return;
    }
    if (!pendingResolved) {
      const pending = getPendingQuery();
      if (pending) {
        clearPendingQuery();
        setQuery(pending);
        router.replace(`/search?q=${encodeURIComponent(pending)}`);
      }
      setPendingResolved(true);
    }
  }, [urlQuery, pendingResolved, router]);

  const { data: analysis, isLoading, error, errorCode, retry } = useAnalysis(query, !!user);

  useEffect(() => {
    if (!query || !user || !analysis) return;
    const key = `${query}:${analysis.projectType}`;
    if (builtStackFor.current === key) return;
    builtStackFor.current = key;
    const existing = stacks.find(
      (s) => s.prompt === query && s.sourceAnalysis?.projectType === analysis.projectType,
    );
    if (existing) {
      setActiveStackId(existing.id);
    } else {
      createStackFromAnalysis(query, analysis);
    }
    try {
      sessionStorage.setItem('stack2set:assembly', '1');
    } catch {
      // ignore — the animation is optional
    }
    router.replace('/workspace');
  }, [query, user, analysis, createStackFromAnalysis, router, setActiveStackId, stacks]);

  const authModal = (
    <AuthModal
      open={authOpen}
      onOpenChange={setAuthOpen}
      query={attemptedQuery || query}
      next={query ? `/search?q=${encodeURIComponent(query)}` : '/workspace'}
    />
  );

  if (authLoading) {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-6">
        <Loader2 className="h-6 w-6 animate-spin text-teal-400" />
      </main>
    );
  }

  if (!query) {
    return (
      <>
        <SearchHome onSearch={handleSearch} />
        {authModal}
      </>
    );
  }

  if (!user) {
    return (
      <>
        <SignInPrompt query={query} onOpenAuth={() => setAuthOpen(true)} />
        {authModal}
      </>
    );
  }

  if (isLoading || (analysis && builtStackFor.current === `${query}:${analysis.projectType}`)) {
    return <LoadingScreen query={query} />;
  }

  if (error || !analysis) {
    return (
      <ErrorState
        message={error ?? 'No analysis available for this project.'}
        onRetry={retry}
        notProject={errorCode === 'NOT_A_PROJECT'}
        onSearch={errorCode === 'NOT_A_PROJECT' ? handleSearch : undefined}
      />
    );
  }

  return <LoadingScreen query={query} />;
}

export function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Search className="h-5 w-5 animate-spin" />
            <span className="text-sm">Loading search...</span>
          </div>
        </div>
      }
    >
      <SearchPageContent />
    </Suspense>
  );
}
