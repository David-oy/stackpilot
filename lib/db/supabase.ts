import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { categoriesSeedData, providersSeedData } from './seed';
import { fetchWithTimeout } from './supabase-fetch';
import type {
  CategoryRecord,
  ProviderRecord,
  ProviderWithRelations,
} from './schema';
import type { CategoryInput, ProviderInput, ProviderStore } from './store';

type Row = Record<string, unknown>;

function mapRowToCategory(row: Row): CategoryRecord {
  return {
    id: String(row.slug),
    name: String(row.name),
    slug: String(row.slug),
    icon: String(row.icon ?? 'layers'),
    description: String(row.description ?? ''),
    aliases: Array.isArray(row.aliases) ? (row.aliases as string[]) : [],
    createdAt: String(row.created_at ?? ''),
    updatedAt: String(row.updated_at ?? ''),
  };
}

function mapRowToProvider(row: Row): ProviderRecord {
  const categoryRef = row.categories as { slug?: string } | undefined;
  return {
    id: String(row.slug),
    categoryId: String(categoryRef?.slug ?? row.category_slug ?? ''),
    name: String(row.name),
    slug: String(row.slug),
    shortDescription: String(row.short_description ?? ''),
    longDescription: String(row.long_description ?? ''),
    logo: row.logo ? String(row.logo) : null,
    officialWebsite: String(row.official_website ?? ''),
    documentation: String(row.documentation ?? ''),
    github: row.github ? String(row.github) : null,
    pricingModel: (row.pricing_model as ProviderRecord['pricingModel']) ?? 'freemium',
    freeTier: Boolean(row.free_tier),
    openSource: Boolean(row.open_source),
    popularityScore: Number(row.popularity_score ?? 50),
    featured: Boolean(row.featured),
    status: (row.status as ProviderRecord['status']) ?? 'active',
    createdAt: String(row.created_at ?? ''),
    updatedAt: String(row.updated_at ?? ''),
  };
}

export class SupabaseProviderStore implements ProviderStore {
  private client: SupabaseClient;
  private tablePrefix: string;
  private ensured = false;

  constructor(url: string, key: string) {
    const timeoutMs = Number(process.env.SUPABASE_TIMEOUT_MS ?? 10_000);
    this.client = createClient(url, key, {
      auth: { persistSession: false },
      global: { fetch: fetchWithTimeout(timeoutMs) },
    });
    this.tablePrefix = process.env.SUPABASE_TABLE_PREFIX ?? '';
  }

  private t(name: string): string {
    return `${this.tablePrefix}${name}`;
  }

  async ensureSeeded(): Promise<void> {
    if (this.ensured) return;
    this.ensured = true;
    const started = Date.now();
    try {
      const { count } = await this.client
        .from(this.t('providers'))
        .select('id', { count: 'exact', head: true });
      if (count != null && count > 0) {
        console.log(
          `[supabase] provider store already seeded (${count} providers) — skipped in ${Date.now() - started}ms`,
        );
        return;
      }
      console.log(
        `[supabase] provider store empty (${count ?? 'n/a'} providers) — seeding ${categoriesSeedData.length} categories and ${providersSeedData.length} providers...`,
      );
      for (const category of categoriesSeedData) {
        await this.client.from(this.t('categories')).upsert(
          {
            name: category.name,
            slug: category.slug,
            icon: category.icon,
            description: category.description,
            aliases: category.aliases ?? [],
          },
          { onConflict: 'slug' },
        );
      }
      for (const provider of providersSeedData) {
        const { data: category } = await this.client
          .from(this.t('categories'))
          .select('id')
          .eq('slug', provider.categoryId)
          .maybeSingle();
        const categoryId = (category as { id?: string } | null)?.id;
        if (!categoryId) continue;
        const { data: existing } = await this.client
          .from(this.t('providers'))
          .select('id')
          .eq('slug', provider.slug)
          .maybeSingle();
        let id = (existing as { id?: string } | null)?.id ?? null;
        const payload = {
          category_id: categoryId,
          name: provider.name,
          slug: provider.slug,
          short_description: provider.shortDescription,
          long_description: provider.longDescription,
          logo: provider.logo,
          official_website: provider.officialWebsite,
          documentation: provider.documentation,
          github: provider.github,
          pricing_model: provider.pricingModel,
          free_tier: provider.freeTier,
          open_source: provider.openSource,
          popularity_score: provider.popularityScore,
          featured: provider.featured,
          status: provider.status,
        };
        if (id) {
          await this.client.from(this.t('providers')).update(payload).eq('id', id);
        } else {
          const { data: inserted } = await this.client
            .from(this.t('providers'))
            .insert(payload)
            .select('id')
            .single();
          id = (inserted as { id?: string } | null)?.id ?? null;
        }
        if (id) await this.syncRelations(id, provider);
      }
      console.log(`[supabase] provider store seeded in ${Date.now() - started}ms`);
    } catch (error) {
      console.error('[supabase] ensureSeeded failed:', error);
    }
  }

  private async syncRelations(providerId: string, provider: ProviderInput) {
    await this.client.from(this.t('provider_features')).delete().eq('provider_id', providerId);
    await this.client.from(this.t('provider_tags')).delete().eq('provider_id', providerId);
    await this.client.from(this.t('provider_alternatives')).delete().eq('provider_id', providerId);
    if (provider.features.length) {
      await this.client.from(this.t('provider_features')).insert(
        provider.features.map((feature) => ({ provider_id: providerId, feature })),
      );
    }
    if (provider.tags.length) {
      await this.client.from(this.t('provider_tags')).insert(
        provider.tags.map((tag) => ({ provider_id: providerId, tag })),
      );
    }
    for (const slug of provider.alternatives) {
      const { data: alt } = await this.client
        .from(this.t('providers'))
        .select('id')
        .eq('slug', slug)
        .maybeSingle();
      const altId = (alt as { id?: string } | null)?.id;
      if (altId) {
        await this.client
          .from(this.t('provider_alternatives'))
          .upsert(
            { provider_id: providerId, alternative_provider_id: altId },
            { onConflict: 'provider_id,alternative_provider_id' },
          );
      }
    }
  }

  private async hydrate(rows: Row[]): Promise<ProviderWithRelations[]> {
    if (!rows.length) return [];
    const ids = rows.map((r) => r.id).filter((v): v is string => typeof v === 'string');
    const [features, tags, alternatives] = await Promise.all([
      this.client
        .from(this.t('provider_features'))
        .select('provider_id, feature')
        .in('provider_id', ids),
      this.client
        .from(this.t('provider_tags'))
        .select('provider_id, tag')
        .in('provider_id', ids),
      this.client
        .from(this.t('provider_alternatives'))
        .select('provider_id, alternative_provider_id')
        .in('provider_id', ids),
    ]);

    const featuresByProvider = new Map<string, string[]>();
    const tagsByProvider = new Map<string, string[]>();
    const altIdsByProvider = new Map<string, string[]>();
    for (const f of (features.data ?? []) as unknown as Row[]) {
      const list = featuresByProvider.get(String(f.provider_id)) ?? [];
      list.push(String(f.feature));
      featuresByProvider.set(String(f.provider_id), list);
    }
    for (const t of (tags.data ?? []) as unknown as Row[]) {
      const list = tagsByProvider.get(String(t.provider_id)) ?? [];
      list.push(String(t.tag));
      tagsByProvider.set(String(t.provider_id), list);
    }
    for (const a of (alternatives.data ?? []) as unknown as Row[]) {
      const list = altIdsByProvider.get(String(a.provider_id)) ?? [];
      list.push(String(a.alternative_provider_id));
      altIdsByProvider.set(String(a.provider_id), list);
    }

    const allAltIds = Array.from(new Set(Array.from(altIdsByProvider.values()).flat()));
    const slugById = new Map<string, string>();
    if (allAltIds.length) {
      const { data: altRows } = await this.client
        .from(this.t('providers'))
        .select('id, slug')
        .in('id', allAltIds);
      for (const a of (altRows ?? []) as unknown as Row[]) {
        slugById.set(String(a.id), String(a.slug));
      }
    }

    return rows.map((row) => {
      const providerId = String(row.id);
      const record = mapRowToProvider(row);
      return {
        ...record,
        features: featuresByProvider.get(providerId) ?? [],
        tags: tagsByProvider.get(providerId) ?? [],
        alternatives: (altIdsByProvider.get(providerId) ?? [])
          .map((id) => slugById.get(id))
          .filter((slug): slug is string => Boolean(slug)),
      };
    });
  }

  private categorySelect = 'id, name, slug, icon, description, aliases, created_at, updated_at';

  private providerSelect =
    '*, categories!providers_category_id_fkey(slug)';

  async getAllCategories(): Promise<CategoryRecord[]> {
    const { data } = await this.client
      .from(this.t('categories'))
      .select(this.categorySelect)
      .order('name');
    return ((data ?? []) as unknown as Row[]).map(mapRowToCategory);
  }

  async getCategoryBySlug(slugOrId: string): Promise<CategoryRecord | null> {
    const { data } = await this.client
      .from(this.t('categories'))
      .select(this.categorySelect)
      .eq('slug', slugOrId)
      .maybeSingle();
    return data ? mapRowToCategory(data as unknown as Row) : null;
  }

  async getAllProviders(): Promise<ProviderWithRelations[]> {
    const { data } = await this.client
      .from(this.t('providers'))
      .select(this.providerSelect)
      .order('popularity_score', { ascending: false });
    return this.hydrate((data ?? []) as unknown as Row[]);
  }

  async getProvidersByCategory(categorySlug: string): Promise<ProviderWithRelations[]> {
    const { data: category } = await this.client
      .from(this.t('categories'))
      .select('id')
      .eq('slug', categorySlug)
      .maybeSingle();
    const categoryId = (category as { id?: string } | null)?.id;
    if (!categoryId) return [];
    const { data } = await this.client
      .from(this.t('providers'))
      .select(this.providerSelect)
      .eq('category_id', categoryId)
      .order('popularity_score', { ascending: false });
    return this.hydrate((data ?? []) as unknown as Row[]);
  }

  async getProviderBySlug(slug: string): Promise<ProviderWithRelations | null> {
    const { data } = await this.client
      .from(this.t('providers'))
      .select(this.providerSelect)
      .eq('slug', slug)
      .maybeSingle();
    if (!data) return null;
    const hydrated = await this.hydrate([data as unknown as Row]);
    return hydrated[0] ?? null;
  }

  async searchProviders(query: string): Promise<ProviderWithRelations[]> {
    const needle = `%${query.toLowerCase().trim()}%`;
    const { data } = await this.client
      .from(this.t('providers'))
      .select(this.providerSelect)
      .or(`name.ilike.${needle},short_description.ilike.${needle},long_description.ilike.${needle}`)
      .order('popularity_score', { ascending: false })
      .limit(50);
    return this.hydrate((data ?? []) as unknown as Row[]);
  }

  async getFeaturedProviders(limit = 8): Promise<ProviderWithRelations[]> {
    const { data } = await this.client
      .from(this.t('providers'))
      .select(this.providerSelect)
      .eq('featured', true)
      .order('popularity_score', { ascending: false })
      .limit(limit);
    return this.hydrate((data ?? []) as unknown as Row[]);
  }

  async getAlternatives(providerSlug: string): Promise<ProviderWithRelations[]> {
    const { data: provider } = await this.client
      .from(this.t('providers'))
      .select('id')
      .eq('slug', providerSlug)
      .maybeSingle();
    const providerId = (provider as { id?: string } | null)?.id;
    if (!providerId) return [];
    const { data } = await this.client
      .from(this.t('provider_alternatives'))
      .select('alternative_provider_id')
      .eq('provider_id', providerId);
    const ids = ((data ?? []) as unknown as Row[]).map((r) => String(r.alternative_provider_id));
    if (!ids.length) return [];
    const { data: alternatives } = await this.client
      .from(this.t('providers'))
      .select(this.providerSelect)
      .in('id', ids);
    return this.hydrate((alternatives ?? []) as unknown as Row[]);
  }

  async saveCategory(category: CategoryInput): Promise<void> {
    await this.client.from(this.t('categories')).upsert(
      {
        name: category.name,
        slug: category.slug,
        icon: category.icon,
        description: category.description,
        aliases: category.aliases ?? [],
      },
      { onConflict: 'slug' },
    );
  }

  async saveProviders(categorySlug: string, providers: ProviderInput[]): Promise<void> {
    const { data: category } = await this.client
      .from(this.t('categories'))
      .select('id')
      .eq('slug', categorySlug)
      .maybeSingle();
    const categoryId = (category as { id?: string } | null)?.id;
    if (!categoryId) return;
    for (const provider of providers) {
      const existing = await this.client
        .from(this.t('providers'))
        .select('id')
        .eq('slug', provider.slug)
        .maybeSingle();
      let id: string | null = (existing as { id?: string } | null)?.id ?? null;
      const payload = {
        category_id: categoryId,
        name: provider.name,
        slug: provider.slug,
        short_description: provider.shortDescription,
        long_description: provider.longDescription,
        logo: provider.logo,
        official_website: provider.officialWebsite,
        documentation: provider.documentation,
        github: provider.github,
        pricing_model: provider.pricingModel,
        free_tier: provider.freeTier,
        open_source: provider.openSource,
        popularity_score: provider.popularityScore,
        featured: provider.featured,
        status: provider.status,
      };
      if (id) {
        await this.client.from(this.t('providers')).update(payload).eq('id', id);
      } else {
        const { data: inserted } = await this.client
          .from(this.t('providers'))
          .insert(payload)
          .select('id')
          .single();
        id = (inserted as { id?: string } | null)?.id ?? null;
      }
      if (id) await this.syncRelations(id, provider);
    }
  }
}
