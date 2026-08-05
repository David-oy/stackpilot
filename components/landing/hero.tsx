'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ArrowRight, Sparkles } from 'lucide-react';
import { LoadingScreen } from '@/components/landing/loading-screen';

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
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingQuery, setLoadingQuery] = useState('');

  const handleSearch = (q: string) => {
    const clean = q.trim().replace(/^I want to build\s*/i, '').replace(/\.{2,}$/, '').trim();
    if (!clean) return;
    setLoadingQuery(clean);
    setLoading(true);
  };

  if (loading) {
    return <LoadingScreen query={loadingQuery} />;
  }

  return (
    <section className="relative overflow-hidden pt-32 pb-20 sm:pt-40 sm:pb-28">
      <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-violet-600/20 blur-[120px]" />
      <div className="pointer-events-none absolute right-0 top-40 -z-10 h-[400px] w-[400px] rounded-full bg-blue-600/15 blur-[100px]" />

      <div className="mx-auto max-w-4xl px-6 text-center">
        <div className="mb-6 inline-flex animate-fade-up items-center gap-2 rounded-full glass px-4 py-1.5 text-xs text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-violet-400" />
          <span>AI-powered tech stack discovery</span>
        </div>

        <h1 className="animate-fade-up text-balance text-5xl font-semibold tracking-tight text-white sm:text-6xl md:text-7xl" style={{ animationDelay: '0.05s' }}>
          What do you want to <span className="gradient-text">build?</span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl animate-fade-up text-balance text-lg text-muted-foreground" style={{ animationDelay: '0.1s' }}>
          Discover every technology, API, database, authentication provider, and service needed to build your next application.
        </p>

        <div className="mx-auto mt-10 max-w-2xl animate-fade-up" style={{ animationDelay: '0.15s' }}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch(query);
            }}
            className="group relative"
          >
            <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-violet-500/30 to-blue-500/30 opacity-0 blur transition-opacity duration-300 group-focus-within:opacity-100" />
            <div className="relative flex items-center gap-2 rounded-2xl glass px-5 py-4">
              <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="I want to build YouTube..."
                className="w-full bg-transparent text-base text-white placeholder:text-muted-foreground focus:outline-none"
              />
              <button
                type="submit"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-violet-500 to-blue-500 text-white transition-transform hover:scale-105"
                aria-label="Search"
              >
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </form>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            <span className="text-xs text-muted-foreground">Popular:</span>
            {popularSearches.map((item) => (
              <button
                key={item}
                onClick={() => {
                  setQuery(`I want to build ${item}...`);
                  handleSearch(item);
                }}
                className="rounded-full glass glass-hover px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-white"
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
