import type { AnalysisProvider } from '@/lib/types';
import type { ProviderWithRelations } from '@/lib/db/schema';
import type { Provider } from '@/lib/providers';
import type { StackProviderInput } from './types';

export type ProviderLike =
  | ProviderWithRelations
  | Provider
  | AnalysisProvider;

const REASON_TEMPLATES = [
  'Recommended for its strong ecosystem, reliability, and production readiness.',
  'A solid, well-documented choice that fits this layer of the stack.',
  'Popular with strong community support and active maintenance.',
  'Great balance of features, pricing, and ease of integration.',
];

export function buildProviderReason(provider: ProviderLike): string {
  if ('reason' in provider && typeof provider.reason === 'string' && provider.reason) {
    return provider.reason;
  }

  const features =
    'features' in provider && Array.isArray(provider.features)
      ? provider.features
      : 'bestUseCases' in provider && Array.isArray(provider.bestUseCases)
        ? provider.bestUseCases
        : [];
  const tags =
    'tags' in provider && Array.isArray(provider.tags) ? provider.tags : [];

  const parts: string[] = [];
  if (features.length) parts.push(features.slice(0, 2).join(' and '));
  if (tags.length) parts.push(tags[0]);

  const template =
    REASON_TEMPLATES[('popularityScore' in provider ? provider.popularityScore ?? 50 : 50) % REASON_TEMPLATES.length];

  return parts.length ? `${template} Strong points: ${parts.join(', ').toLowerCase()}.` : template;
}

export function buildProviderInput(provider: ProviderLike): StackProviderInput {
  if ('slug' in provider && 'pricingModel' in provider) {
    const db = provider as ProviderWithRelations;
    return {
      providerId: db.slug,
      name: db.name,
      description: db.shortDescription,
      reason: buildProviderReason(db),
      website: db.officialWebsite || undefined,
      documentation: db.documentation || undefined,
      github: db.github || undefined,
      pricingModel: db.pricingModel,
      popularityScore: db.popularityScore,
      freeTier: db.freeTier,
      openSource: db.openSource,
      tags: db.tags,
      features: db.features,
    };
  }

  if ('website' in provider && 'bestUseCases' in provider) {
    const ai = provider as AnalysisProvider;
    return {
      providerId: ai.id,
      name: ai.name,
      description: ai.description,
      reason: buildProviderReason(ai),
      website: ai.website,
      documentation: ai.documentation,
      tags: [],
      features: ai.bestUseCases,
    };
  }

  const ui = provider as Provider;
  return {
    providerId: ui.id,
    name: ui.name,
    description: ui.description,
    reason: buildProviderReason(ui),
    tags: ui.tags,
    freeTier: ui.freeTier,
    openSource: ui.openSource,
    features: [],
  };
}
