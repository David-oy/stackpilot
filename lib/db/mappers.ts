import type { AnalysisProvider } from '@/lib/types';
import { slugify } from './seed/helpers';
import type { PricingModel, ProviderWithRelations } from './schema';
import type { ProviderInput } from './store';
import { sanitizeProviderInput } from './validate';

const REASON_TEMPLATES = [
  'Top pick — the most popular and production-ready option for this category.',
  'Excellent alternative with strong tooling, documentation, and community.',
  'Great balance of features, pricing, and ease of integration.',
  'Solid production choice backed by active maintenance and adoption.',
  'Specialized option that excels at specific or niche use cases.',
  'Beginner-friendly option to get started quickly with minimal setup.',
];

export function providerToAnalysis(
  provider: ProviderWithRelations,
  index: number,
): AnalysisProvider {
  const bestUseCases = provider.features.slice(0, 3);
  const reasonBase = REASON_TEMPLATES[Math.min(index, REASON_TEMPLATES.length - 1)];
  const focus = provider.tags[0] ? ` Particularly strong for ${provider.tags[0].toLowerCase()}.` : '';
  return {
    id: provider.slug,
    rank: index + 1,
    name: provider.name,
    description: provider.shortDescription,
    reason: reasonBase + focus,
    bestUseCases,
    website: provider.officialWebsite || undefined,
    documentation: provider.documentation || undefined,
    freeTier: provider.freeTier || undefined,
    pricingModel: provider.pricingModel || undefined,
    popularityScore: provider.popularityScore || undefined,
    openSource: provider.openSource || undefined,
    tags: provider.tags.length ? provider.tags : undefined,
  };
}

export function fromAnalysisProvider(
  categoryId: string,
  provider: AnalysisProvider,
): ProviderInput {
  const slug = provider.id && provider.id.trim() ? provider.id.trim() : slugify(provider.name);
  const now = new Date().toISOString();
  const normalizedPricing = (
    provider.pricingModel ? provider.pricingModel.toLowerCase() : 'freemium'
  ) as PricingModel;
  const validPricingModels: PricingModel[] = [
    'free',
    'freemium',
    'usage-based',
    'subscription',
    'per-seat',
    'open-source',
  ];
  return sanitizeProviderInput({
    id: slug,
    categoryId,
    name: provider.name,
    slug,
    shortDescription: provider.description,
    longDescription: provider.reason ?? provider.description,
    logo: null,
    officialWebsite: provider.website ?? '',
    documentation: provider.documentation ?? '',
    github: null,
    pricingModel: validPricingModels.includes(normalizedPricing)
      ? normalizedPricing
      : 'freemium',
    freeTier: provider.freeTier ?? false,
    openSource: provider.openSource ?? false,
    popularityScore:
      provider.popularityScore ?? Math.max(1, 100 - (provider.rank ?? 6) * 10),
    featured: (provider.rank ?? 6) === 1,
    status: 'active',
    createdAt: now,
    updatedAt: now,
    aiSummary: provider.reason || undefined,
    aiSuggested: provider.aiSuggested ?? false,
    source: 'ai-fallback',
    lastSyncedAt: now,
    features: provider.bestUseCases ?? [],
    tags: provider.tags ?? [],
    alternatives: [],
  });
}
