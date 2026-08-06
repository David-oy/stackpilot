import type { Comparison, ComparisonRow, StackProviderItem } from './types';

export function pricingLabel(item: StackProviderItem): string {
  const model = item.pricingModel ? item.pricingModel.replace('-', ' ') : 'n/a';
  const tier = item.freeTier ? ' · free tier' : '';
  const open = item.openSource ? ' · open source' : '';
  return `${model}${tier}${open}`;
}

function derivePros(item: StackProviderItem): string[] {
  const pros: string[] = [];
  if (item.features?.length) {
    pros.push(...item.features.slice(0, 3));
  }
  if (item.freeTier) pros.push('Free tier available');
  if (item.openSource) pros.push('Open source');
  if ((item.popularityScore ?? 50) >= 70) pros.push('Widely adopted');
  if (item.documentation) pros.push('Documentation available');
  return pros.slice(0, 5);
}

function deriveCons(item: StackProviderItem): string[] {
  const cons: string[] = [];
  if (!item.freeTier && item.pricingModel !== 'free' && item.pricingModel !== 'open-source') {
    cons.push('No free tier');
  }
  if (!item.openSource) cons.push('Not open source');
  if ((item.popularityScore ?? 50) < 60) cons.push('Smaller community');
  if (item.pricingModel === 'usage-based') cons.push('Costs scale with usage');
  if (!item.documentation && !item.website) cons.push('Limited documentation');
  return cons.length ? cons : ['Few known trade-offs'];
}

export function buildComparison(providers: StackProviderItem[]): Comparison | null {
  if (providers.length < 2) return null;
  const headers = providers.map((p) => p.name);
  const rows: ComparisonRow[] = [
    { label: 'Description', values: providers.map((p) => p.description || '—') },
    {
      label: 'Pricing',
      values: providers.map((p) => pricingLabel(p)),
    },
    {
      label: 'Open Source',
      values: providers.map((p) => (p.openSource ? 'Yes' : 'No')),
    },
    {
      label: 'Free Tier',
      values: providers.map((p) => (p.freeTier ? 'Yes' : 'No')),
    },
    {
      label: 'Popularity',
      values: providers.map((p) =>
        p.popularityScore ? `${p.popularityScore}/100` : '—',
      ),
    },
    {
      label: 'Documentation',
      values: providers.map((p) =>
        p.documentation ? `[Link](${p.documentation})` : p.website ? `[Link](${p.website})` : '—',
      ),
    },
    { label: 'Pros', values: providers.map((p) => derivePros(p).join(', ') || '—') },
    { label: 'Cons', values: providers.map((p) => deriveCons(p).join(', ') || '—') },
  ];
  return { headers, rows };
}

export { deriveCons, derivePros };
