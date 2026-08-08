'use client';

import { useEffect, useState } from 'react';
import { ArrowRight, Search } from 'lucide-react';

/**
 * Reusable search input used on the home page and the results page. Owns its
 * own input state (seeded from `initialQuery`) and delegates submission to
 * `onSearch`, letting the caller decide whether to run the search or prompt
 * for authentication.
 */
export function SearchBar({
  initialQuery = '',
  onSearch,
  placeholder = 'I want to build YouTube...',
  autoFocus = false,
  size = 'lg',
  className,
  inputId,
}: {
  initialQuery?: string;
  onSearch: (query: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  size?: 'lg' | 'md';
  className?: string;
  inputId?: string;
}) {
  const [query, setQuery] = useState(initialQuery);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        onSearch(query);
      }}
      className={`group relative ${className ?? ''}`}
    >
      <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-teal-500/30 to-cyan-500/30 opacity-0 blur transition-opacity duration-300 group-focus-within:opacity-100" />
      <div
        className={`relative flex items-center gap-2 rounded-2xl glass shadow-lg shadow-black/5 transition-shadow focus-within:shadow-xl focus-within:shadow-teal-500/10 ${
          size === 'lg' ? 'px-5 py-4' : 'px-4 py-2.5'
        }`}
      >
        <Search
          className={`shrink-0 text-muted-foreground ${size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'}`}
        />
        <input
          type="text"
          id={inputId}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          aria-label="Describe your project"
          className="w-full bg-transparent text-base text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
        <button
          type="submit"
          aria-label="Search"
          className={`flex shrink-0 items-center justify-center rounded-xl bg-teal-500 text-white shadow-md shadow-teal-500/25 transition-transform hover:scale-105 active:scale-95 ${
            size === 'lg' ? 'h-9 w-9' : 'h-8 w-8'
          }`}
        >
          <ArrowRight className={size === 'lg' ? 'h-4 w-4' : 'h-3.5 w-3.5'} />
        </button>
      </div>
    </form>
  );
}
