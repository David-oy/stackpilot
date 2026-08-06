'use client';

import type { ReactNode } from 'react';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import {
  formatCurrency,
  isProviderFree,
  providerPaidCost,
  type CostCategoryBreakdown,
} from '@/lib/stacks/health';
import type { StackProviderItem } from '@/lib/stacks/types';

export function costLine(p: { freeTier: boolean; paidCost: number }): string {
  if (p.paidCost > 0) {
    return p.freeTier ? `Free · ${formatCurrency(p.paidCost)}/mo if paid` : `${formatCurrency(p.paidCost)}/mo`;
  }
  return 'Free';
}

export function ProviderCostHover({
  provider,
  children,
}: {
  provider: StackProviderItem;
  children: ReactNode;
}) {
  const free = isProviderFree(provider);
  const paid = providerPaidCost(provider);
  return (
    <HoverCard openDelay={120} closeDelay={60}>
      <HoverCardTrigger asChild>{children}</HoverCardTrigger>
      <HoverCardContent side="bottom" align="start" className="w-64">
        <p className="text-xs font-semibold text-foreground">{provider.name}</p>
        <p className="mt-0.5 text-[11px] capitalize text-muted-foreground">
          {provider.pricingModel ? provider.pricingModel.replace('-', ' ') : 'Pricing model n/a'}
        </p>
        <div className="mt-2 space-y-1.5 text-[11px]">
          {free && (
            <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-300 ring-1 ring-emerald-500/20">
              Free tier available
            </span>
          )}
          <p className="text-muted-foreground">
            {paid > 0
              ? free
                ? `Start for free, ~${formatCurrency(paid)}/mo once you outgrow the free tier.`
                : `Estimated at ~${formatCurrency(paid)}/mo.`
              : 'Fully free to use.'}
          </p>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}

export function CostBreakdownHover({
  breakdown,
  children,
}: {
  breakdown: CostCategoryBreakdown[];
  children: ReactNode;
}) {
  const total = breakdown.reduce((sum, cat) => sum + cat.countedCost, 0);
  return (
    <HoverCard openDelay={120} closeDelay={60}>
      <HoverCardTrigger asChild>{children}</HoverCardTrigger>
      <HoverCardContent side="bottom" align="start" className="w-80">
        <p className="text-xs font-semibold text-foreground">Monthly cost breakdown</p>
        <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
          Estimated from the cheapest option per category. Only providers you must pay for to use
          count — anything with a free tier counts as $0.
        </p>
        <div className="mt-3 max-h-64 space-y-3 overflow-y-auto pr-1">
          {breakdown.map((cat) => (
            <div key={cat.categoryId}>
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] font-medium text-foreground">{cat.categoryName}</p>
                <span className="text-[11px] text-muted-foreground">
                  {cat.countedCost > 0 ? `${formatCurrency(cat.countedCost)}/mo` : 'Free'}
                </span>
              </div>
              <div className="mt-1.5 space-y-1">
                {cat.providers.map((p) => (
                  <div key={p.providerId} className="flex items-center justify-between gap-2 text-[11px]">
                    <div className="flex min-w-0 items-center gap-1.5">
                      <span className="truncate text-muted-foreground">{p.providerName}</span>
                      {p.freeTier && (
                        <span className="shrink-0 rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[9px] text-emerald-300 ring-1 ring-emerald-500/20">
                          free tier
                        </span>
                      )}
                    </div>
                    <span className={`shrink-0 ${p.freeTier ? 'text-emerald-300' : 'text-muted-foreground'}`}>
                      {costLine(p)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-foreground/5 pt-2.5">
          <span className="text-[11px] text-muted-foreground">Total estimate</span>
          <span className="text-xs font-semibold text-foreground">
            {total > 0 ? `${formatCurrency(total)}/mo` : 'Free'}
          </span>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
