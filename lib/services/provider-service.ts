import type { AnalysisProvider } from '@/lib/types';
import { categoryCache, normalizeCacheKey, providerCache, searchCache } from '@/lib/db/cache';
import { getPersistedAnalysis, setPersistedAnalysis } from '@/lib/db/analysis-cache-db';
import { fromAnalysisProvider, providerToAnalysis } from '@/lib/db/mappers';
import type {
  CategoryRecord,
  ProviderWithRelations,
} from '@/lib/db/schema';
import { getConfiguredStore } from '@/lib/db/store';
import type { CategoryInput, ProviderInput } from '@/lib/db/store';
import { normalizeProviderName, normalizeWebsiteForMatch, sanitizeProviderInput } from '@/lib/db/validate';
import { slugify } from '@/lib/db/seed/helpers';
import type { PricingModel } from '@/lib/db/schema';

export type NewProviderInput = {
  name: string;
  description: string;
  website?: string;
  documentation?: string;
  github?: string;
  tags?: string[];
  features?: string[];
  pricingModel?: string;
  freeTier?: boolean;
  openSource?: boolean;
  reason?: string;
  aiSuggested?: boolean;
};

type StoreLike = {
  getAllCategories(): Promise<CategoryRecord[]>;
  getCategoryBySlug(slugOrId: string): Promise<CategoryRecord | null>;
  getAllProviders(): Promise<ProviderWithRelations[]>;
  getProvidersByCategory(categorySlug: string): Promise<ProviderWithRelations[]>;
  getProviderBySlug(slug: string): Promise<ProviderWithRelations | null>;
  searchProviders(query: string): Promise<ProviderWithRelations[]>;
  getFeaturedProviders(limit?: number): Promise<ProviderWithRelations[]>;
  getAlternatives(providerSlug: string): Promise<ProviderWithRelations[]>;
  saveCategory(category: CategoryInput): Promise<void>;
  saveProviders(categorySlug: string, providers: ProviderInput[]): Promise<void>;
};

let storePromise: Promise<StoreLike> | null = null;

function store(): Promise<StoreLike> {
  if (!storePromise) {
    storePromise = getConfiguredStore().catch((error) => {
      storePromise = null;
      throw error;
    });
  }
  return storePromise;
}

export const providerService = {
  async getAllCategories(): Promise<CategoryRecord[]> {
    const key = 'all-categories';
    const cached = categoryCache.get(key);
    if (cached) return cached as CategoryRecord[];
    const categories = await (await store()).getAllCategories();
    categoryCache.set(key, categories);
    return categories;
  },

  async getCategoryBySlug(slugOrId: string): Promise<CategoryRecord | null> {
    const key = `category:${slugOrId}`;
    const cached = categoryCache.get(key);
    if (cached) return cached as CategoryRecord | null;
    const category = await (await store()).getCategoryBySlug(slugOrId);
    categoryCache.set(key, category);
    return category;
  },

  async getProvidersByCategory(categorySlug: string): Promise<ProviderWithRelations[]> {
    const key = `providers:category:${categorySlug}`;
    const cached = providerCache.get(key);
    if (cached) return cached as ProviderWithRelations[];
    const providers = await (await store()).getProvidersByCategory(categorySlug);
    providerCache.set(key, providers);
    return providers;
  },

  async getProviderBySlug(slug: string): Promise<ProviderWithRelations | null> {
    const key = `providers:slug:${slug}`;
    const cached = providerCache.get(key);
    if (cached) return cached as ProviderWithRelations | null;
    const provider = await (await store()).getProviderBySlug(slug);
    providerCache.set(key, provider);
    return provider;
  },

  async getAllProviders(): Promise<ProviderWithRelations[]> {
    const key = 'providers:all';
    const cached = providerCache.get(key);
    if (cached) return cached as ProviderWithRelations[];
    const providers = await (await store()).getAllProviders();
    providerCache.set(key, providers);
    return providers;
  },

  async searchProviders(query: string): Promise<ProviderWithRelations[]> {
    const normalized = normalizeCacheKey(query);
    const key = `providers:search:${normalized}`;
    const cached = searchCache.get(key);
    if (cached) return cached as ProviderWithRelations[];
    const providers = await (await store()).searchProviders(normalized);
    searchCache.set(key, providers);
    return providers;
  },

  async getFeaturedProviders(limit = 8): Promise<ProviderWithRelations[]> {
    const key = `providers:featured:${limit}`;
    const cached = providerCache.get(key);
    if (cached) return cached as ProviderWithRelations[];
    const providers = await (await store()).getFeaturedProviders(limit);
    providerCache.set(key, providers);
    return providers;
  },

  async getAlternatives(providerSlug: string): Promise<ProviderWithRelations[]> {
    const key = `providers:alternatives:${providerSlug}`;
    const cached = providerCache.get(key);
    if (cached) return cached as ProviderWithRelations[];
    const alternatives = await (await store()).getAlternatives(providerSlug);
    providerCache.set(key, alternatives);
    return alternatives;
  },

  async getCategoryProvidersAsAnalysis(
    categorySlug: string,
    limit = 6,
  ): Promise<AnalysisProvider[]> {
    const providers = await this.getProvidersByCategory(categorySlug);
    return providers.slice(0, limit).map(providerToAnalysis);
  },

  async storeFallbackCategoryAndProviders(
    category: { id: string; name: string; description: string },
    providers: AnalysisProvider[],
  ): Promise<void> {
    try {
      const s = await store();
      const existing = await this.getCategoryBySlug(category.id);
      if (!existing) {
        await s.saveCategory({
          name: category.name,
          slug: category.id,
          icon: 'layers',
          description: category.description,
          aliases: [],
        });
        categoryCache.delete('all-categories');
      }
      const records: ProviderInput[] = providers.map((p) => fromAnalysisProvider(category.id, p));
      await s.saveProviders(category.id, records);
      providerCache.delete(`providers:category:${category.id}`);
      searchCache.clear();
    } catch (error) {
      console.warn('[provider-service] storeFallbackCategoryAndProviders failed:', error);
    }
  },

  async getAnalysis(cacheKey: string): Promise<unknown | null> {
    return getPersistedAnalysis(cacheKey);
  },

  async setAnalysis(cacheKey: string, analysis: unknown, description?: string): Promise<void> {
    await setPersistedAnalysis(cacheKey, description ?? cacheKey, analysis);
  },

  /**
   * Persist a single provider into the shared catalog for a category.
   * Refuses to create duplicates: matches against the whole catalog by
   * normalized name and normalized domain. When a match exists in another
   * category, it links the provider to this category (idempotent) and returns
   * it with `duplicate: true` instead of writing a new row.
   */
  async upsertProvider(
    categorySlug: string,
    input: NewProviderInput,
  ): Promise<{ provider: ProviderWithRelations | null; created: boolean; duplicate: boolean }> {
    const nameKey = normalizeProviderName(input.name);
    const websiteKey = input.website ? normalizeWebsiteForMatch(input.website) : '';
    const all = await this.getAllProviders();
    const match = all.find(
      (p) =>
        normalizeProviderName(p.name) === nameKey ||
        (websiteKey && p.officialWebsite
          ? normalizeWebsiteForMatch(p.officialWebsite) === websiteKey
          : false),
    );
    if (match) {
      if (match.categoryId !== categorySlug) {
        const s = await store();
        await s.saveProviders(categorySlug, [buildProviderRecord(categorySlug, input)]);
        providerCache.delete(`providers:category:${categorySlug}`);
      }
      return { provider: match, created: false, duplicate: true };
    }

    const s = await store();
    await s.saveProviders(categorySlug, [buildProviderRecord(categorySlug, input)]);
    providerCache.delete(`providers:category:${categorySlug}`);
    searchCache.clear();

    const provider = await this.getProviderBySlug(slugify(input.name) || 'provider');
    return { provider, created: true, duplicate: false };
  },
};

function buildProviderRecord(categorySlug: string, input: NewProviderInput): ProviderInput {
  const now = new Date().toISOString();
  const slug = slugify(input.name) || 'provider';
  return sanitizeProviderInput({
    id: slug,
    categoryId: categorySlug,
    name: input.name,
    slug,
    shortDescription: input.description || input.name,
    longDescription: input.reason || input.description || '',
    logo: null,
    officialWebsite: input.website ?? '',
    documentation: input.documentation ?? '',
    github: input.github ?? null,
    pricingModel: (input.pricingModel ?? 'freemium') as PricingModel,
    freeTier: input.freeTier ?? false,
    openSource: input.openSource ?? false,
    popularityScore: 50,
    featured: false,
    status: 'active',
    createdAt: now,
    updatedAt: now,
    features: input.features ?? [],
    tags: input.tags ?? [],
    alternatives: [],
    aiSuggested: input.aiSuggested ?? false,
    source: input.aiSuggested ? 'ai-add' : 'user',
    lastSyncedAt: now,
  });
}
