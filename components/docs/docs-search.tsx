'use client';

import { useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ArrowRight, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { allDocs, docGroups } from '@/lib/docs';

export function DocsSearch() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length === 0) return [];
    return allDocs
      .filter(
        (doc) =>
          doc.title.toLowerCase().includes(q) ||
          doc.description.toLowerCase().includes(q) ||
          doc.keywords.some((keyword) => keyword.toLowerCase().includes(q)),
      )
      .slice(0, 6);
  }, [query]);

  const navigate = (slug: string) => {
    setOpen(false);
    setQuery('');
    router.push(`/docs/${slug}`);
  };

  return (
    <div className="relative mx-auto w-full max-w-xl">
      <div className="group relative">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Search documentation..."
          aria-label="Search documentation"
          className="w-full rounded-2xl glass py-3.5 pl-11 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/40"
        />
      </div>

      {open && query.trim().length > 0 && (
        <div className="absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-2xl glass p-2 shadow-xl shadow-black/10">
          {results.length === 0 ? (
            <p className="px-3 py-3 text-sm text-muted-foreground">
              No results for &quot;{query}&quot;.
            </p>
          ) : (
            <ul>
              {results.map((doc) => {
                const group = docGroups.find((g) => g.items.some((i) => i.slug === doc.slug));
                return (
                  <li key={doc.slug}>
                    <button
                      onMouseDown={(e) => {
                        e.preventDefault();
                        navigate(doc.slug);
                      }}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-foreground/5',
                      )}
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-foreground/5">
                        <BookOpen className="h-4 w-4 text-violet-400" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-foreground">
                          {doc.title}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {group?.title} · {doc.description}
                        </span>
                      </span>
                      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
