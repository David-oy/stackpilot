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
};

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const now = '2026-01-01T00:00:00.000Z';

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
    };
  });
}
