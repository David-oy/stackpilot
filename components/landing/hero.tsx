'use client';

import { Sparkles } from 'lucide-react';
import { SearchBar } from '@/components/search/search-bar';
import { AuthModal } from '@/components/auth/auth-modal';
import { useProjectSearch } from '@/hooks/use-project-search';

const popularSearches = [
  'YouTube',
  'Spotify',
  'Netflix',
  'Instagram',
  'Uber',
  'Discord',
  'AI Chatbot',
];

export function Hero() {
  const { handleSearch, authOpen, setAuthOpen, attemptedQuery } = useProjectSearch();

  return (
    <section id="hero" className="relative overflow-hidden pb-20 pt-32 sm:pb-28 sm:pt-40">
      <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-teal-500/20 blur-[120px]" />
      <div className="pointer-events-none absolute right-0 top-40 -z-10 h-[400px] w-[400px] rounded-full bg-blue-600/15 blur-[100px]" />
      <div className="pointer-events-none absolute -left-20 bottom-0 -z-10 h-[300px] w-[300px] rounded-full bg-fuchsia-600/10 blur-[90px]" />

      <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
        <div className="mb-7 inline-flex animate-fade-up items-center gap-2 rounded-full glass px-4 py-1.5 text-xs font-medium tracking-wide text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-teal-400" />
          <span>AI-powered tech stack discovery</span>
        </div>

        <h1
          className="animate-fade-up text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-6xl md:text-7xl"
          style={{ animationDelay: '0.05s' }}
        >
          What do you want to <span className="gradient-text">build?</span>
        </h1>

        <p
          className="mx-auto mt-6 max-w-2xl animate-fade-up text-balance text-base leading-relaxed text-muted-foreground sm:text-lg"
          style={{ animationDelay: '0.1s' }}
        >
          Discover every technology, API, database, authentication provider, and service needed to
          build your next application.
        </p>

        <div className="mx-auto mt-10 max-w-2xl animate-fade-up" style={{ animationDelay: '0.15s' }}>
          <SearchBar onSearch={handleSearch} />

          <div className="mt-7 flex flex-wrap items-center justify-center gap-2">
            <span className="text-xs text-muted-foreground">Popular:</span>
            {popularSearches.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => handleSearch(`I want to build ${item}`)}
                className="rounded-full glass glass-hover px-3 py-1.5 text-xs text-muted-foreground transition-all hover:text-foreground"
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </div>

      <AuthModal open={authOpen} onOpenChange={setAuthOpen} query={attemptedQuery} />
    </section>
  );
}
