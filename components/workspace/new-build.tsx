'use client';

import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { SearchBar } from '@/components/search/search-bar';
import { RecentSearches } from '@/components/search/recent-searches';
import { AuthModal } from '@/components/auth/auth-modal';
import { useProjectSearch } from '@/hooks/use-project-search';

const SUGGESTIONS = [
  'I want to build a video streaming platform like Netflix',
  'A SaaS dashboard with AI chat for customer support',
  'A food delivery app with realtime order tracking',
  'A marketplace for vintage video games',
  'A realtime multiplayer fitness tracking app',
];

export function NewBuild() {
  const { handleSearch, authOpen, setAuthOpen, attemptedQuery } = useProjectSearch();

  return (
    <div className="space-y-6">
      <div className="rounded-2xl glass p-6 sm:p-10">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mx-auto max-w-2xl py-6 text-center sm:py-10"
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-xs text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-violet-400" />
            <span>New Build</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            What do you want to <span className="gradient-text">build?</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Describe your project and we&apos;ll research the best providers and build your stack.
          </p>

          <div className="mt-8">
            <SearchBar onSearch={handleSearch} autoFocus placeholder="I want to build YouTube..." />
          </div>

          <div className="mt-8">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Try something like
            </p>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => handleSearch(suggestion)}
                  className="rounded-full border border-foreground/5 bg-foreground/[0.02] px-3 py-1.5 text-xs text-muted-foreground transition-all hover:border-violet-500/20 hover:text-foreground"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>

          <div className="mx-auto mt-10 max-w-md text-left">
            <RecentSearches />
          </div>
        </motion.div>
      </div>

      <AuthModal
        open={authOpen}
        onOpenChange={setAuthOpen}
        query={attemptedQuery}
        next={attemptedQuery ? `/search?q=${encodeURIComponent(attemptedQuery)}` : '/workspace'}
      />
    </div>
  );
}
