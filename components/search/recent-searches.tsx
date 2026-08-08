'use client';

import Link from 'next/link';
import { History, Search } from 'lucide-react';
import { useAnalysisContext } from '@/lib/analysis-context';

/**
 * Lists the visitor's recent searches (stored locally) so past results are one
 * click away. Hidden entirely when there is no history.
 */
export function RecentSearches() {
  const { searchHistory, clearHistory } = useAnalysisContext();

  if (searchHistory.length === 0) return null;

  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500/20 to-cyan-500/20 ring-1 ring-teal-500/20">
            <History className="h-4 w-4 text-teal-300" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">Search History</h3>
        </div>
        <button
          type="button"
          onClick={clearHistory}
          className="text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          Clear
        </button>
      </div>
      <div className="mt-4 space-y-1.5">
        {searchHistory.map((item) => (
          <Link
            key={item}
            href={`/search?q=${encodeURIComponent(item)}`}
            className="flex items-center gap-2.5 rounded-lg border border-foreground/5 bg-foreground/[0.02] px-3 py-2.5 text-xs text-muted-foreground transition-colors hover:border-teal-500/25 hover:text-foreground"
          >
            <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
            <span className="truncate">{item}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
