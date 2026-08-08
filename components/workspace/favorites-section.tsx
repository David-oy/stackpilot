'use client';

import { Loader2, Star, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { useFavorites } from '@/lib/favorites-context';
import { useBrowseData } from '@/hooks/use-browse-data';
import { useAuth } from '@/lib/auth/auth-context';
import { providerCostLabel } from '@/lib/stacks/health';
import type { ProviderWithRelations } from '@/lib/db/schema';

export function FavoritesSection() {
  const { favorites, hydrated, toggleFavorite } = useFavorites();
  const { providers, categories, loading } = useBrowseData();
  const { user } = useAuth();

  const providersBySlug = new Map(providers.map((p) => [p.slug, p]));
  const categoryById = new Map(categories.map((c) => [c.id, c.name]));

  const items = favorites
    .map((favorite) => ({
      favorite,
      provider: providersBySlug.get(favorite.slug),
    }))
    .filter((item): item is { favorite: (typeof favorites)[number]; provider: ProviderWithRelations } =>
      Boolean(item.provider),
    );

  const remove = async (slug: string) => {
    try {
      await toggleFavorite(slug);
      toast.success('Removed from favorites');
    } catch {
      toast.error('Could not remove favorite.');
    }
  };

  return (
    <section className="rounded-2xl glass p-5">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20 ring-1 ring-amber-500/20">
          <Star className="h-4 w-4 text-amber-300" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">Favorites</h3>
          <p className="text-[11px] text-muted-foreground">
            {user ? 'Saved to your Stack2Set account' : 'Saved on this device'}
          </p>
        </div>
      </div>

      {!hydrated || loading ? (
        <div className="mt-4 flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-teal-400" />
        </div>
      ) : items.length === 0 ? (
        <p className="mt-4 rounded-xl border border-dashed border-foreground/10 py-6 text-center text-xs text-muted-foreground">
          No favorites yet. Star a provider while browsing.
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {items.map(({ favorite, provider }) => (
            <li
              key={favorite.slug}
              className="flex items-center gap-3 rounded-xl border border-foreground/5 bg-foreground/[0.02] p-2.5 transition-colors hover:border-teal-500/25"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500/20 to-cyan-500/20 ring-1 ring-foreground/10">
                <span className="text-xs font-semibold text-teal-300">
                  {provider.name.charAt(0)}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <Link
                  href={`/browse/providers/${provider.slug}`}
                  className="block truncate text-xs font-medium text-foreground transition-colors hover:text-teal-300"
                >
                  {provider.name}
                </Link>
                <p className="truncate text-[10px] text-muted-foreground">
                  {categoryById.get(provider.categoryId) ?? 'Provider'} ·{' '}
                  {providerCostLabel(provider)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void remove(favorite.slug)}
                aria-label={`Remove ${provider.name} from favorites`}
                title="Remove from favorites"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-foreground/5 text-muted-foreground transition-colors hover:border-rose-500/30 hover:text-rose-300"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
