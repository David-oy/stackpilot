'use client';

import type { ReactNode } from 'react';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { formatCurrency, isProviderFree, providerPaidCost } from '@/lib/stacks/health';
import type { StackProviderItem } from '@/lib/stacks/types';

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
