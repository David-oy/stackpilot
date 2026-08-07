import { pricingModelMonthlyCost } from '@/lib/stacks/health';
import type { PricingModel, ProviderWithRelations } from '../schema';

export type SeedProvider = {
  categoryId: string;
  name: string;
  slug?: string;
  shortDescription: string;
  longDescription?: string;
  logo?: string | null;
  website: string;
  docs: string;
  github?: string | null;
  pricingModel?: PricingModel;
  freeTier?: boolean;
  openSource?: boolean;
  popularityScore?: number;
  featured?: boolean;
  features?: string[];
  tags?: string[];
  alternatives?: string[];
  // --- Extended profile (overrides below derivation) ---
  enterprisePricing?: string;
  communityRating?: number;
  aiSummary?: string;
  pros?: string[];
  cons?: string[];
  bestUseCases?: string[];
  integrations?: string[];
  apis?: string[];
  sdks?: string[];
  aiFeatures?: string[];
  languages?: string[];
  compatibility?: Record<string, boolean>;
};

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const now = '2026-01-01T00:00:00.000Z';

function hashValue(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i += 1) {
    h = (h * 31 + input.charCodeAt(i)) >>> 0;
  }
  return h;
}

const DEFAULT_LANGUAGES = ['JavaScript', 'TypeScript', 'Node.js'];
const DEFAULT_APIS = ['REST', 'Webhooks'];
const DEFAULT_COMPATIBILITY: Record<string, boolean> = {
  React: true,
  'Next.js': true,
  Vue: true,
  Angular: true,
  Node: true,
  Python: true,
  Java: true,
  Go: true,
  Mobile: true,
};

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function clampScore(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(value)));
}

export function deriveProviderProfile(
  p: SeedProvider,
  slug: string,
): Partial<ProviderWithRelations> {
  const h = hashValue(slug);
  const popularity = p.popularityScore ?? 50;
  const communityRating = p.communityRating ?? round1(3.6 + (popularity / 100) * 1.4);
  const stack2SetRating =
    p.communityRating ?? round1(Math.min(5, communityRating + (p.openSource ? 0.4 : 0.2)));
  const monthlyCost = p.pricingModel ? pricingModelMonthlyCost(p.pricingModel) : 0;
  const derivedPros = [
    p.freeTier ? 'Generous free tier to get started without upfront cost' : 'Clear and transparent pricing model',
    p.openSource ? 'Fully open source with an active community' : 'Production-grade managed service with vendor support',
    ...(p.tags ?? []).slice(0, 2).map((t) => `Strong fit for ${t.toLowerCase()}`),
  ];
  const derivedCons = [
    monthlyCost > 0
      ? `Paid tier adds ~$${monthlyCost}/mo per project`
      : 'Advanced enterprise features may require a paid plan',
    ...(p.features ?? []).slice(0, 1).map((f) => `Specialized feature set focused on ${f.toLowerCase()}`),
  ];
  return {
    communityRating,
    stack2SetRating,
    monthlyCost,
    enterprisePricing:
      p.enterprisePricing ??
      (p.pricingModel && p.pricingModel !== 'open-source' ? 'Custom enterprise plans available' : 'Self-hosted / source available'),
    learningCurve: p.popularityScore ? clampScore(5 - popularity / 25, 1, 5) : 3,
    speed: p.popularityScore ? clampScore(3 + popularity / 30, 1, 5) : 4,
    scalability: p.openSource ? 4 : clampScore(3 + (popularity / 100) * 2, 1, 5),
    reliability: clampScore(4 + (popularity / 100), 1, 5),
    security: Boolean(p.github) || p.pricingModel !== 'free',
    compliance: ['SOC 2', 'GDPR'],
    integrations: p.integrations ?? (p.tags ?? []).slice(0, 4),
    apis: p.apis ?? DEFAULT_APIS,
    sdks: p.sdks ?? [],
    aiFeatures: p.aiFeatures ?? [],
    languages: p.languages ?? DEFAULT_LANGUAGES,
    compatibility: p.compatibility ?? DEFAULT_COMPATIBILITY,
    pros: p.pros ?? derivedPros,
    cons: p.cons ?? derivedCons,
    bestUseCases: p.bestUseCases ?? (p.features ?? []).slice(0, 3),
    aiSummary: p.aiSummary ?? p.longDescription ?? p.shortDescription,
    source: 'seed',
    lastSyncedAt: now,
  };
}

export function buildProviders(rows: SeedProvider[]): ProviderWithRelations[] {
  return rows.map((p, index) => {
    const slug = p.slug ?? slugify(p.name);
    return {
      id: slug,
      categoryId: p.categoryId,
      name: p.name,
      slug,
      shortDescription: p.shortDescription,
      longDescription: p.longDescription ?? p.shortDescription,
      logo: p.logo ?? null,
      officialWebsite: p.website,
      documentation: p.docs,
      github: p.github ?? null,
      pricingModel: p.pricingModel ?? 'freemium',
      freeTier: p.freeTier ?? false,
      openSource: p.openSource ?? false,
      popularityScore: p.popularityScore ?? 50,
      featured: p.featured ?? index === 0,
      status: 'active',
      createdAt: now,
      updatedAt: now,
      features: p.features ?? [],
      tags: p.tags ?? [],
      alternatives: p.alternatives ?? [],
      ...deriveProviderProfile(p, slug),
    };
  });
}
