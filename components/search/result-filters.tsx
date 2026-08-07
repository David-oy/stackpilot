'use client';

import { SlidersHorizontal, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ProviderFilter = 'all' | 'freeTier' | 'openSource';

const options: { value: ProviderFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'freeTier', label: 'Free tier' },
  { value: 'openSource', label: 'Open source' },
];

/**
 * Filter control for the results page. Applies a client-side filter over the
 * recommended providers so users can narrow results without a new search.
 */
export function ResultFilters({
  value,
  onChange,
}: {
  value: ProviderFilter;
  onChange: (value: ProviderFilter) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        <SlidersHorizontal className="h-3.5 w-3.5" />
        Filters
      </span>
      <div className="flex items-center gap-1 rounded-full border border-foreground/5 bg-foreground/[0.02] p-1">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              'rounded-full px-3 py-1 text-xs font-medium transition-colors',
              value === option.value
                ? 'bg-gradient-to-r from-violet-500 to-blue-500 text-white'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
      {value !== 'all' && (
        <button
          type="button"
          onClick={() => onChange('all')}
          className="inline-flex items-center gap-1 text-xs text-violet-400 transition-colors hover:text-violet-300"
        >
          <X className="h-3 w-3" />
          Clear
        </button>
      )}
    </div>
  );
}
