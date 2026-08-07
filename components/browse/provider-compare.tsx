'use client';

import { useMemo } from 'react';
import { Star, Trophy, ShieldCheck, Zap, DollarSign, GraduationCap, TrendingUp } from 'lucide-react';
import type { CategoryRecord, ProviderWithRelations } from '@/lib/db/schema';
import { isProviderFree, providerCostLabel } from '@/lib/stacks/health';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type Row = {
  label: string;
  values: React.ReactNode[];
  bestIndex?: number;
};

function bestIndex(values: (string | number | boolean | undefined)[]): number | undefined {
  const numeric = values.map((v) => (typeof v === 'number' ? v : undefined));
  if (numeric.every((v) => v === undefined)) return undefined;
  return numeric.indexOf(Math.max(...(numeric as number[])));
}

function valueOf(v: unknown): React.ReactNode {
  if (Array.isArray(v)) {
    if (v.length === 0) return <span className="text-muted-foreground/50">—</span>;
    return v.join(', ');
  }
  if (typeof v === 'boolean') return v ? 'Yes' : 'No';
  if (typeof v === 'number') return v.toLocaleString('en-US');
  if (v === undefined || v === null || v === '') return <span className="text-muted-foreground/50">—</span>;
  return String(v);
}

function highlightBest(row: Row) {
  const values = row.values;
  if (row.bestIndex === undefined || row.bestIndex < 0 || row.bestIndex >= values.length) {
    return values;
  }
  return values.map((v, i) =>
    i === row.bestIndex ? (
      <span key={i} className="font-medium text-emerald-300">
        {v}
        <span className="ml-1 inline-flex -translate-y-0.5 items-center gap-0.5 text-[9px] font-semibold uppercase tracking-wide text-emerald-300/80">
          <Trophy className="h-2.5 w-2.5" />
        </span>
      </span>
    ) : (
      v
    ),
  );
}

export function ProviderCompare({
  open,
  onOpenChange,
  providers,
  categoryById,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  providers: ProviderWithRelations[];
  categoryById: Map<string, CategoryRecord>;
}) {
  const rows = useMemo(() => {
    const fmt = (v: unknown) => valueOf(v);
    const best = (values: (string | number | boolean | undefined)[]) =>
      bestIndex(values.map((v) => (typeof v === 'number' ? v : undefined)));

    const costValues = providers.map((p) => (isProviderFree(p) ? 0 : p.monthlyCost ?? 50));
    const costBest = costValues.indexOf(Math.min(...costValues));

    const rows: Row[] = [
      {
        label: 'Category',
        values: providers.map((p) => categoryById.get(p.categoryId)?.name ?? '—'),
      },
      {
        label: 'Pricing model',
        values: providers.map((p) => (p.pricingModel ? String(p.pricingModel) : '—')),
      },
      {
        label: 'Free tier',
        values: providers.map((p) => (p.freeTier ? 'Yes' : 'No')),
      },
      {
        label: 'Open source',
        values: providers.map((p) => (p.openSource ? 'Yes' : 'No')),
      },
      {
        label: 'Est. monthly cost',
        values: providers.map((p) => providerCostLabel(p)),
        bestIndex: costBest,
      },
      {
        label: 'Popularity',
        values: providers.map((p) => p.popularityScore),
        bestIndex: best(providers.map((p) => p.popularityScore)),
      },
      {
        label: 'Stack2Set rating',
        values: providers.map((p) => p.stack2SetRating),
        bestIndex: best(providers.map((p) => p.stack2SetRating)),
      },
      {
        label: 'Community rating',
        values: providers.map((p) => p.communityRating),
        bestIndex: best(providers.map((p) => p.communityRating)),
      },
      { label: 'Enterprise pricing', values: providers.map((p) => fmt(p.enterprisePricing)) },
      {
        label: 'Learning curve',
        values: providers.map((p) => (typeof p.learningCurve === 'number' ? `${p.learningCurve}/5` : '—')),
        bestIndex: best(providers.map((p) => (typeof p.learningCurve === 'number' ? 6 - p.learningCurve : undefined))),
      },
      {
        label: 'Speed',
        values: providers.map((p) => (typeof p.speed === 'number' ? `${p.speed}/5` : '—')),
        bestIndex: best(providers.map((p) => p.speed)),
      },
      {
        label: 'Scalability',
        values: providers.map((p) => (typeof p.scalability === 'number' ? `${p.scalability}/5` : '—')),
        bestIndex: best(providers.map((p) => p.scalability)),
      },
      {
        label: 'Reliability',
        values: providers.map((p) => (typeof p.reliability === 'number' ? `${p.reliability}/5` : '—')),
        bestIndex: best(providers.map((p) => p.reliability)),
      },
      {
        label: 'Security',
        values: providers.map((p) => (p.security ? 'Yes' : 'No')),
      },
      { label: 'Compliance', values: providers.map((p) => fmt(p.compliance)) },
      { label: 'Features', values: providers.map((p) => fmt(p.features?.slice(0, 6))) },
      { label: 'Integrations', values: providers.map((p) => fmt(p.integrations?.slice(0, 6))) },
      { label: 'APIs', values: providers.map((p) => fmt(p.apis?.slice(0, 5))) },
      { label: 'SDKs', values: providers.map((p) => fmt(p.sdks?.slice(0, 5))) },
      { label: 'AI features', values: providers.map((p) => fmt(p.aiFeatures?.slice(0, 5))) },
      { label: 'Languages', values: providers.map((p) => fmt(p.languages?.slice(0, 5))) },
      { label: 'Pros', values: providers.map((p) => fmt(p.pros?.slice(0, 4))) },
      { label: 'Cons', values: providers.map((p) => fmt(p.cons?.slice(0, 4))) },
      { label: 'Best use cases', values: providers.map((p) => fmt(p.bestUseCases?.slice(0, 3))) },
      { label: 'Website', values: providers.map((p) => p.officialWebsite ?? '—') },
      { label: 'Documentation', values: providers.map((p) => p.documentation ?? '—') },
    ];

    return rows;
  }, [providers, categoryById]);

  if (providers.length < 2) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle className="text-lg">Compare providers</DialogTitle>
          <DialogDescription>
            Comparing {providers.length} providers side by side. Green highlights mark the best value.
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 w-40 bg-background p-2 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  Criterion
                </th>
                {providers.map((provider) => (
                  <th key={provider.slug} className="border-l border-foreground/5 p-2 text-left align-top">
                    <span className="block text-sm font-semibold text-foreground">{provider.name}</span>
                    <span className="mt-0.5 block text-[10px] text-muted-foreground">
                      {categoryById.get(provider.categoryId)?.name ?? ''}
                    </span>
                    <span className="mt-1.5 flex flex-wrap gap-1">
                      {provider.stack2SetRating ? (
                        <span className="inline-flex items-center gap-0.5 rounded-md bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-300">
                          <Star className="h-2.5 w-2.5 fill-current" />
                          {provider.stack2SetRating.toFixed(1)}
                        </span>
                      ) : null}
                      {isProviderFree(provider) ? (
                        <span className="rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-300">
                          Free tier
                        </span>
                      ) : null}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label} className="border-t border-foreground/5">
                  <td className="sticky left-0 z-10 bg-background p-2 text-[11px] font-medium text-muted-foreground">
                    {row.label}
                  </td>
                  {highlightBest(row).map((value, i) => (
                    <td key={i} className="border-l border-foreground/5 p-2 align-top text-xs leading-relaxed text-foreground/90">
                      {value}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function compareBadge(provider: ProviderWithRelations, group: ProviderWithRelations[]): string | null {
  const popularity = group.map((p) => p.popularityScore ?? 0);
  const ratings = group.map((p) => p.stack2SetRating ?? p.communityRating ?? 0);
  const speeds = group.map((p) => p.speed ?? 0);
  const scale = group.map((p) => p.scalability ?? 0);
  const costs = group.map((p) => (isProviderFree(p) ? 0 : p.monthlyCost ?? 50));
  const learning = group.map((p) => (typeof p.learningCurve === 'number' ? p.learningCurve : 5));

  const maxIndex = (arr: number[]) => arr.indexOf(Math.max(...arr));
  const minIndex = (arr: number[]) => arr.indexOf(Math.min(...arr));
  const idx = group.findIndex((p) => p.slug === provider.slug);

  if (idx === maxIndex(popularity) && Math.max(...popularity) > 0) return 'Most popular';
  if (idx === maxIndex(ratings) && Math.max(...ratings) > 0) return 'Best rated';
  if (idx === maxIndex(speeds) && Math.max(...speeds) > 0) return 'Fastest';
  if (idx === maxIndex(scale) && Math.max(...scale) > 0) return 'Most scalable';
  if (idx === minIndex(costs) && costs[idx] === 0) return 'Free';
  if (idx === minIndex(costs) && Math.max(...costs) > 0) return 'Best value';
  if (idx === minIndex(learning) && provider.learningCurve !== undefined) return 'Easiest to learn';
  return null;
}

export function badgeIcon(badge: string): React.ComponentType<{ className?: string }> {
  switch (badge) {
    case 'Most popular':
      return TrendingUp;
    case 'Best rated':
      return Star;
    case 'Most secure':
      return ShieldCheck;
    case 'Fastest':
      return Zap;
    case 'Best value':
      return DollarSign;
    case 'Easiest to learn':
      return GraduationCap;
    default:
      return Trophy;
  }
}
