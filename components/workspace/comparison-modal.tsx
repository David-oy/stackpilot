'use client';

import { useMemo, useState } from 'react';
import { Scale, X } from 'lucide-react';
import { toast } from 'sonner';
import { useStack } from '@/lib/stack-context';
import type { StackProviderItem } from '@/lib/stacks/types';
import { buildComparison } from '@/lib/stacks/comparison';
import { ProviderLogo } from './logo';
import { ProviderCostHover } from './cost-hover';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';

export function ComparisonModal({
  open,
  onOpenChange,
  presetCategoryId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  presetCategoryId?: string;
}) {
  const { activeStack } = useStack();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const options = useMemo(() => {
    if (!activeStack) return [];
    const entries =
      activeStack.categories.filter((c) => c.providers.length > 0);
    return entries.map((entry) => ({
      categoryId: entry.categoryId,
      categoryName: entry.categoryName,
      providers: entry.providers,
    }));
  }, [activeStack]);

  const toggle = (provider: StackProviderItem) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(provider.providerId)) next.delete(provider.providerId);
      else if (next.size < 4) next.add(provider.providerId);
      else toast('You can compare up to 4 providers at a time.');
      return next;
    });
  };

  const selectedProviders = useMemo(() => {
    return options.flatMap((o) => o.providers).filter((p) => selected.has(p.providerId));
  }, [options, selected]);

  const comparison = useMemo(() => buildComparison(selectedProviders), [selectedProviders]);

  const canCompare = selectedProviders.length >= 2;

  const openForCategory = (categoryId: string) => {
    const entry = options.find((o) => o.categoryId === categoryId);
    if (!entry) return;
    setSelected(new Set(entry.providers.slice(0, 2).map((p) => p.providerId)));
  };

  const handleOpenChange = (next: boolean) => {
    if (next && presetCategoryId) openForCategory(presetCategoryId);
    if (!next) setSelected(new Set());
    onOpenChange(next);
  };

  const selectedNames = selectedProviders.map((p) => p.name).join(' vs ');

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Scale className="h-4 w-4 text-violet-400" /> Compare Providers
          </DialogTitle>
          <DialogDescription>
            Select 2–4 providers to compare pricing, open source status, popularity, pros and cons.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[65vh] space-y-5 overflow-y-auto pr-1">
          <div className="space-y-3">
            {options.map((option) => (
              <div key={option.categoryId}>
                <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                  {option.categoryName}
                </p>
                <div className="flex flex-wrap gap-2">
                  {option.providers.map((provider) => {
                    const active = selected.has(provider.providerId);
                    return (
                      <button
                        key={provider.providerId}
                        onClick={() => toggle(provider)}
                        className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs transition-all ${
                          active
                            ? 'border-violet-500/30 bg-violet-500/10 text-foreground'
                            : 'border-foreground/5 bg-foreground/[0.02] text-muted-foreground hover:border-violet-500/20'
                        }`}
                      >
                        <Checkbox checked={active} className="h-3.5 w-3.5" />
                        <ProviderLogo name={provider.name} className="h-5 w-5 rounded text-[9px]" />
                        {provider.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {comparison ? (
            <div className="overflow-x-auto rounded-xl border border-foreground/5">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead>
                  <tr className="border-b border-foreground/5 bg-foreground/[0.02]">
                    <th className="w-32 px-3 py-2.5 text-xs font-medium text-muted-foreground">Attribute</th>
                    {comparison.headers.map((header, i) => (
                      <th key={header} className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <ProviderLogo
                            name={selectedProviders[i]?.name ?? header}
                            className="h-6 w-6 rounded text-[9px]"
                          />
                          <span className="text-sm font-semibold text-foreground">{header}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {comparison.rows.map((row) => (
                    <tr key={row.label} className="border-b border-foreground/5 last:border-0">
                      <td className="px-3 py-2.5 text-xs font-medium text-muted-foreground">{row.label}</td>
                      {row.values.map((value, i) => (
                        <td key={`${row.label}-${i}`} className="px-3 py-2.5 text-xs leading-relaxed text-foreground/90">
                          {row.label === 'Documentation' ? (
                            value === '—' ? (
                              <span className="text-muted-foreground">—</span>
                            ) : (
                              <a
                                href={value.slice(value.indexOf('(') + 1, value.lastIndexOf(')'))}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-violet-300 underline-offset-2 hover:underline"
                              >
                                Link
                              </a>
                            )
                          ) : row.label === 'Est. Cost' ? (
                            <ProviderCostHover provider={selectedProviders[i]}>
                              <span className="cursor-help underline decoration-dotted decoration-foreground/30 underline-offset-2">
                                {value}
                              </span>
                            </ProviderCostHover>
                          ) : (
                            value
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-foreground/10 py-10 text-center">
              {selectedProviders.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {options.length ? 'Pick at least two providers to compare.' : 'No providers in your stack yet.'}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">Select at least two providers to compare.</p>
              )}
            </div>
          )}
        </div>

        <div className="mt-2 flex items-center justify-between">
          <p className="truncate text-xs text-muted-foreground">
            {canCompare ? <span className="text-violet-300">{selectedNames}</span> : ' '}
          </p>
          <div className="flex items-center gap-2">
            {canCompare && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelected(new Set())}
                className="h-8 gap-1.5 text-xs"
              >
                <X className="h-3 w-3" /> Clear
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
