import { categoriesSeedData, providersSeedData } from './seed';
import type {
  CategoryRecord,
  ProviderRecord,
  ProviderWithRelations,
} from './schema';

export type CategoryInput = Pick<CategoryRecord, 'name' | 'slug' | 'icon' | 'description' | 'aliases'>;

export type ProviderInput = ProviderWithRelations;

export interface ProviderStore {
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
}

const now = () => new Date().toISOString();

function pickProviderRelations(record: ProviderRecord, relations: {
  features: Map<string, string[]>;
  tags: Map<string, string[]>;
  alternatives: Map<string, string[]>;
}): ProviderWithRelations {
  return {
    ...record,
    features: relations.features.get(record.id) ?? [],
    tags: relations.tags.get(record.id) ?? [],
    alternatives: relations.alternatives.get(record.id) ?? [],
  };
}

export class InMemoryProviderStore implements ProviderStore {
  private categoriesById = new Map<string, CategoryRecord>();
  private categoriesBySlug = new Map<string, CategoryRecord>();
  private providersById = new Map<string, ProviderRecord>();
  private providersBySlug = new Map<string, ProviderRecord>();
  private providersByCategory = new Map<string, ProviderRecord[]>();
  private features = new Map<string, string[]>();
  private tags = new Map<string, string[]>();
  private alternatives = new Map<string, string[]>();

  constructor() {
    this.seed();
  }

  private seed() {
    for (const category of categoriesSeedData) {
      this.insertCategory(category);
    }
    for (const provider of providersSeedData) {
      this.insertProvider(provider);
    }
  }

  private insertCategory(category: CategoryRecord) {
    this.categoriesById.set(category.id, category);
    this.categoriesBySlug.set(category.slug, category);
    if (!this.categoriesBySlug.has(category.id)) {
      this.categoriesBySlug.set(category.id, category);
    }
    for (const alias of category.aliases ?? []) {
      this.categoriesBySlug.set(alias, category);
    }
  }

  private insertProvider(provider: ProviderWithRelations) {
    const { features, tags, alternatives, ...record } = provider;
    this.providersById.set(record.id, record);
    this.providersBySlug.set(record.slug, record);
    if (!this.providersBySlug.has(record.id)) {
      this.providersBySlug.set(record.id, record);
    }
    const categoryKey = record.categoryId;
    const current = this.providersByCategory.get(categoryKey) ?? [];
    const existingIndex = current.findIndex((p) => p.slug === record.slug || p.id === record.id);
    if (existingIndex >= 0) {
      current[existingIndex] = record;
    } else {
      current.push(record);
    }
    current.sort((a, b) => b.popularityScore - a.popularityScore);
    this.providersByCategory.set(categoryKey, current);
    this.features.set(record.id, features);
    this.tags.set(record.id, tags);
    this.alternatives.set(record.id, alternatives);
  }

  async getAllCategories(): Promise<CategoryRecord[]> {
    return Array.from(this.categoriesById.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }

  async getCategoryBySlug(slugOrId: string): Promise<CategoryRecord | null> {
    return this.categoriesBySlug.get(slugOrId) ?? null;
  }

  async getAllProviders(): Promise<ProviderWithRelations[]> {
    return Array.from(this.providersById.values()).map((record) =>
      pickProviderRelations(record, {
        features: this.features,
        tags: this.tags,
        alternatives: this.alternatives,
      }),
    );
  }

  async getProvidersByCategory(categorySlug: string): Promise<ProviderWithRelations[]> {
    const category = this.categoriesBySlug.get(categorySlug);
    const categoryId = category?.id ?? categorySlug;
    const records = this.providersByCategory.get(categoryId) ?? [];
    return records.map((record) =>
      pickProviderRelations(record, {
        features: this.features,
        tags: this.tags,
        alternatives: this.alternatives,
      }),
    );
  }

  async getProviderBySlug(slug: string): Promise<ProviderWithRelations | null> {
    const record = this.providersBySlug.get(slug);
    if (!record) return null;
    return pickProviderRelations(record, {
      features: this.features,
      tags: this.tags,
      alternatives: this.alternatives,
    });
  }

  async searchProviders(query: string): Promise<ProviderWithRelations[]> {
    const needle = query.toLowerCase().trim();
    const results: ProviderRecord[] = [];
    for (const record of this.providersById.values()) {
      const features = this.features.get(record.id) ?? [];
      const tags = this.tags.get(record.id) ?? [];
      const haystack = [
        record.name,
        record.slug,
        record.shortDescription,
        record.longDescription,
        ...tags,
        ...features,
      ]
        .join(' ')
        .toLowerCase();
      if (haystack.includes(needle)) {
        results.push(record);
      }
    }
    results.sort((a, b) => b.popularityScore - a.popularityScore);
    return results.map((record) =>
      pickProviderRelations(record, {
        features: this.features,
        tags: this.tags,
        alternatives: this.alternatives,
      }),
    );
  }

  async getFeaturedProviders(limit = 8): Promise<ProviderWithRelations[]> {
    const records = Array.from(this.providersById.values())
      .filter((p) => p.featured)
      .sort((a, b) => b.popularityScore - a.popularityScore)
      .slice(0, limit);
    return records.map((record) =>
      pickProviderRelations(record, {
        features: this.features,
        tags: this.tags,
        alternatives: this.alternatives,
      }),
    );
  }

  async getAlternatives(providerSlug: string): Promise<ProviderWithRelations[]> {
    const provider = this.providersBySlug.get(providerSlug);
    if (!provider) return [];
    const alternativeSlugs = this.alternatives.get(provider.id) ?? [];
    const results: ProviderRecord[] = [];
    for (const slug of alternativeSlugs) {
      const alt = this.providersBySlug.get(slug);
      if (alt) results.push(alt);
    }
    return results.map((record) =>
      pickProviderRelations(record, {
        features: this.features,
        tags: this.tags,
        alternatives: this.alternatives,
      }),
    );
  }

  async saveCategory(category: CategoryInput): Promise<void> {
    const timestamp = now();
    const existing = this.categoriesBySlug.get(category.slug);
    const record: CategoryRecord = {
      id: category.slug,
      name: category.name,
      slug: category.slug,
      icon: category.icon,
      description: category.description,
      aliases: category.aliases ?? [],
      createdAt: existing?.createdAt ?? timestamp,
      updatedAt: timestamp,
    };
    this.insertCategory(record);
  }

  async saveProviders(categorySlug: string, providers: ProviderInput[]): Promise<void> {
    const category = await this.getCategoryBySlug(categorySlug);
    if (!category) return;
    for (const provider of providers) {
      this.insertProvider({ ...provider, categoryId: category.id, status: 'active' });
    }
  }
}

let instance: ProviderStore | null = null;

export function createProviderStore(): ProviderStore {
  if (instance) return instance;
  instance = new InMemoryProviderStore();
  return instance;
}

export async function getConfiguredStore(): Promise<ProviderStore> {
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (supabaseUrl && (serviceRoleKey || anonKey)) {
    const { SupabaseProviderStore } = await import('./supabase');
    const store = new SupabaseProviderStore(supabaseUrl, serviceRoleKey ?? anonKey!, {
      canWrite: Boolean(serviceRoleKey),
    });
    await store.ensureSeeded();
    return store;
  }
  return createProviderStore();
}
