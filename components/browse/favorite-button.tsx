'use client';

import { useState } from 'react';
import { Loader2, Star } from 'lucide-react';
import { toast } from 'sonner';
import { useFavorites } from '@/lib/favorites-context';
import { cn } from '@/lib/utils';

export function FavoriteButton({
  slug,
  categoryId,
  showLabel = false,
  className,
}: {
  slug: string;
  categoryId?: string;
  showLabel?: boolean;
  className?: string;
}) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const [busy, setBusy] = useState(false);
  const favorite = isFavorite(slug);

  const onToggle = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await toggleFavorite(slug, categoryId);
      toast.success(favorite ? 'Removed from favorites' : 'Added to favorites');
    } catch {
      toast.error('Could not update favorites.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={favorite}
      title={favorite ? 'Remove from favorites' : 'Save to favorites'}
      className={cn(
        'inline-flex items-center rounded-lg border text-xs font-medium transition-colors',
        favorite
          ? 'border-amber-500/40 bg-amber-500/15 text-amber-300'
          : 'border-foreground/5 text-muted-foreground hover:border-amber-500/30 hover:text-foreground',
        showLabel ? 'gap-1.5 px-3 py-2' : 'h-7 w-7 shrink-0 justify-center',
        className,
      )}
    >
      {busy ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Star className={cn('h-3.5 w-3.5', favorite && 'fill-current')} />
      )}
      {showLabel && (favorite ? 'Saved' : 'Save to favorites')}
    </button>
  );
}
