'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { History, Search, Layers } from 'lucide-react';
import { useAnalysisContext } from '@/lib/analysis-context';
import { useStack } from '@/lib/stack-context';

function timeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function WorkspaceHistory() {
  const router = useRouter();
  const { searchHistory, clearHistory } = useAnalysisContext();
  const { stacks, setActiveStackId } = useStack();

  const recentStacks = [...stacks].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl glass p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500/20 to-blue-500/20 ring-1 ring-violet-500/20">
                <Search className="h-4 w-4 text-violet-300" />
              </div>
              <h2 className="text-sm font-semibold text-foreground">Recent Searches</h2>
            </div>
            {searchHistory.length > 0 && (
              <button
                type="button"
                onClick={clearHistory}
                className="text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                Clear
              </button>
            )}
          </div>
          <div className="mt-4 space-y-1.5">
            {searchHistory.length === 0 ? (
              <p className="rounded-xl border border-dashed border-foreground/10 py-8 text-center text-xs text-muted-foreground">
                No searches yet. Describe a project to get started.
              </p>
            ) : (
              searchHistory.map((item) => (
                <Link
                  key={item}
                  href={`/search?q=${encodeURIComponent(item)}`}
                  className="flex items-center gap-2.5 rounded-lg border border-foreground/5 bg-foreground/[0.02] px-3 py-2.5 text-xs text-muted-foreground transition-colors hover:border-violet-500/20 hover:text-foreground"
                >
                  <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
                  <span className="truncate">{item}</span>
                </Link>
              ))
            )}
          </div>
        </section>

        <section className="rounded-2xl glass p-6">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-500/20 ring-1 ring-emerald-500/20">
              <History className="h-4 w-4 text-emerald-300" />
            </div>
            <h2 className="text-sm font-semibold text-foreground">Recently Updated Stacks</h2>
          </div>
          <div className="mt-4 space-y-1.5">
            {recentStacks.length === 0 ? (
              <p className="rounded-xl border border-dashed border-foreground/10 py-8 text-center text-xs text-muted-foreground">
                No stacks yet. Run a New Build to create your first stack.
              </p>
            ) : (
              recentStacks.slice(0, 12).map((stack) => (
                <button
                  key={stack.id}
                  type="button"
                  onClick={() => {
                    setActiveStackId(stack.id);
                    router.push('/workspace');
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg border border-foreground/5 bg-foreground/[0.02] px-3 py-2.5 text-left transition-colors hover:border-violet-500/20 hover:text-foreground"
                >
                  <Layers className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-medium text-foreground">
                      {stack.name}
                    </span>
                    <span className="block truncate text-[11px] text-muted-foreground">
                      {stack.categories.reduce((sum, c) => sum + c.providers.length, 0)} providers ·
                      updated {timeAgo(stack.updatedAt)}
                    </span>
                  </span>
                </button>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
