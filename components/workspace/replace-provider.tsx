'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Loader2, RefreshCw } from 'lucide-react';
import type { ProviderWithRelations } from '@/lib/db/schema';
import type { StackProviderItem } from '@/lib/stacks/types';
import { buildProviderInput } from '@/lib/stacks/provider-fields';
import { useStack } from '@/lib/stack-context';
import { ProviderLogo } from './logo';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export function ReplaceProviderDialog({
  open,
  onOpenChange,
  categoryId,
  categoryName,
  current,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryId: string;
  categoryName: string;
  current: StackProviderItem;
}) {
  const { replaceProvider } = useStack();
  const [providers, setProviders] = useState<ProviderWithRelations[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setProviders(null);
    setError(null);
    fetch(`/api/providers?category=${encodeURIComponent(categoryId)}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('Failed to load providers.'))))
      .then((data: { providers: ProviderWithRelations[] }) => {
        if (!cancelled) setProviders(data.providers);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [open, categoryId]);

  const handleReplace = (provider: ProviderWithRelations) => {
    replaceProvider(categoryId, current.providerId, buildProviderInput(provider));
    toast.success(`${current.name} replaced with ${provider.name}`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <RefreshCw className="h-4 w-4 text-teal-400" />
            Replace {current.name}
          </DialogTitle>
          <DialogDescription>
            Choose another provider for <span className="font-medium text-foreground">{categoryName}</span>.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[55vh] space-y-2 overflow-y-auto pr-1">
          {error && <p className="text-sm text-rose-400">{error}</p>}
          {!providers && !error && (
            <div className="flex items-center justify-center py-10 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          )}
          {providers?.map((provider) => {
            const selected = provider.slug === current.providerId;
            return (
              <button
                key={provider.slug}
                disabled={selected}
                onClick={() => handleReplace(provider)}
                className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all ${
                  selected
                    ? 'cursor-default border-emerald-500/20 bg-emerald-500/[0.04] opacity-60'
                    : 'border-foreground/5 bg-foreground/[0.02] hover:border-teal-500/25 hover:bg-foreground/[0.04]'
                }`}
              >
                <ProviderLogo name={provider.name} className="h-9 w-9 rounded-lg text-sm" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {provider.name}
                    {selected && <span className="ml-2 text-[10px] text-emerald-300">Current</span>}
                  </p>
                  <p className="line-clamp-1 text-xs text-muted-foreground">
                    {provider.shortDescription}
                  </p>
                </div>
                <span className="shrink-0 text-[11px] text-muted-foreground">
                  {provider.pricingModel}
                </span>
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
