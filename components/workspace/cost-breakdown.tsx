'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  computeCostBreakdown,
  formatCurrency,
  type CostCategoryBreakdown,
} from '@/lib/stacks/health';
import type { UserStack } from '@/lib/stacks/types';

function costLine(p: { freeTier: boolean; paidCost: number }): string {
  if (p.paidCost > 0) {
    return p.freeTier
      ? `Free · ${formatCurrency(p.paidCost)}/mo if paid`
      : `${formatCurrency(p.paidCost)}/mo`;
  }
  return 'Free';
}

function CostBreakdownBody({ breakdown }: { breakdown: CostCategoryBreakdown[] }) {
  const total = breakdown.reduce((sum, cat) => sum + cat.countedCost, 0);
  return (
    <div>
      <p className="text-xs text-muted-foreground">
        Every pay-only provider you have selected is counted. Providers with a free tier count as
        $0.
      </p>
      <div className="mt-4 max-h-[50vh] space-y-4 overflow-y-auto pr-1">
        {breakdown.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No providers in this stack yet.
          </p>
        ) : (
          breakdown.map((cat) => (
            <div key={cat.categoryId}>
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-foreground">{cat.categoryName}</p>
                <span className="text-xs text-muted-foreground">
                  {cat.countedCost > 0 ? `${formatCurrency(cat.countedCost)}/mo` : 'Free'}
                </span>
              </div>
              <div className="mt-2 space-y-1.5">
                {cat.providers.map((p) => (
                  <div
                    key={p.providerId}
                    className="flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="flex min-w-0 items-center gap-1.5">
                      <span className="truncate text-muted-foreground">{p.providerName}</span>
                      {p.freeTier && (
                        <span className="shrink-0 rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[9px] text-emerald-300 ring-1 ring-emerald-500/20">
                          free tier
                        </span>
                      )}
                    </div>
                    <span className={`shrink-0 ${p.freeTier ? 'text-emerald-300' : 'text-foreground'}`}>
                      {costLine(p)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-foreground/5 pt-3">
        <span className="text-xs text-muted-foreground">Total estimate</span>
        <span className="text-sm font-semibold text-foreground">
          {total > 0 ? `${formatCurrency(total)}/mo` : 'Free'}
        </span>
      </div>
    </div>
  );
}

export function CostBreakdownDialog({
  stack,
  children,
}: {
  stack: UserStack;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const breakdown = computeCostBreakdown(stack);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            Monthly cost breakdown
          </DialogTitle>
          <DialogDescription>
            How the estimated monthly cost for this stack is calculated.
          </DialogDescription>
        </DialogHeader>
        <CostBreakdownBody breakdown={breakdown} />
      </DialogContent>
    </Dialog>
  );
}
