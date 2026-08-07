import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { pricingModelMonthlyCost } from '@/lib/stacks/health';
import { categoriesSeedData, providersSeedData } from './seed';
import { fetchWithTimeout } from './supabase-fetch';
import {
  normalizeProviderName,
  normalizeWebsiteForMatch,
  sanitizeProviderInput,
} from './validate';
import type {
  CategoryRecord,
  ProviderRecord,
  ProviderWithRelations,
} from './schema';
import type { CategoryInput, ProviderInput, ProviderStore } from './store';

type Row = Record<string, unknown>;

const PROVIDER_COLUMNS =
  'id, category_id, name, slug, official_website, short_description, long_description, logo, documentation, github, pricing_model, free_tier, open_source, popularity_score, featured, status, ai_suggested';

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
  const compat = row.compatibility;
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
    communityRating: num(row.community_rating),
    stack2SetRating: num(row.stack2set_rating),
    monthlyCost: num(row.monthly_cost),
    enterprisePricing: strOrUndef(row.enterprise_pricing),
    learningCurve: num(row.learning_curve),
    speed: num(row.speed),
    scalability: num(row.scalability),
    reliability: num(row.reliability),
    security: row.security == null ? undefined : Boolean(row.security),
    compliance: arr(row.compliance),
    integrations: arr(row.integrations),
    apis: arr(row.apis),
    sdks: arr(row.sdks),
    aiFeatures: arr(row.ai_features),
    languages: arr(row.languages),
    compatibility:
      compat && typeof compat === 'object'
        ? (compat as Record<string, boolean>)
        : undefined,
    pros: arr(row.pros),
    cons: arr(row.cons),
    bestUseCases: arr(row.best_use_cases),
    aiSummary: strOrUndef(row.ai_summary),
    aiSuggested: row.ai_suggested == null ? undefined : Boolean(row.ai_suggested),
    source: strOrUndef(row.source),
    lastSyncedAt: strOrUndef(row.last_synced_at),
  };
}

function num(value: unknown): number | undefined {
  if (value == null || value === '') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function strOrUndef(value: unknown): string | undefined {
  return value == null || value === '' ? undefined : String(value);
}

function arr(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value.filter((v): v is string => typeof v === 'string');
}

type Relations = Pick<ProviderWithRelations, 'features' | 'tags' | 'alternatives'>;

export class SupabaseProviderStore implements ProviderStore {
  private client: SupabaseClient;
  private tablePrefix: string;
  private ensured = false;
  private categoryIdCache = new Map<string, string | null>();

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
        await this.backfillProviderProfiles();
        console.log(
          `[supabase] provider store already seeded (${count} providers) — skipped in ${Date.now() - started}ms`,
        );
        return;
      }
      console.log(
        `[supabase] provider store empty (${count ?? 'n/a'} providers) — seeding ${categoriesSeedData.length} categories and ${providersSeedData.length} providers...`,
      );

      await this.client.from(this.t('categories')).upsert(
        categoriesSeedData.map((category) => ({
          name: category.name,
          slug: category.slug,
          icon: category.icon,
          description: category.description,
          aliases: category.aliases ?? [],
        })),
        { onConflict: 'slug' },
      );

      const { data: categoryRows } = await this.client
        .from(this.t('categories'))
        .select('id, slug');
      const categoryIdBySlug = new Map<string, string>();
      for (const r of (categoryRows ?? []) as unknown as Row[]) {
        categoryIdBySlug.set(String(r.slug), String(r.id));
      }

      const { data: inserted } = await this.client
        .from(this.t('providers'))
        .upsert(
          providersSeedData
            .filter((provider) => categoryIdBySlug.has(provider.categoryId))
            .map((provider) => ({
              category_id: categoryIdBySlug.get(provider.categoryId),
              name: provider.name,
              slug: provider.slug,
              short_description: provider.shortDescription,
              long_description: provider.longDescription,
              logo: provider.logo,
              official_website: provider.officialWebsite || '',
              documentation: provider.documentation || '',
              github: provider.github,
              pricing_model: provider.pricingModel,
              free_tier: provider.freeTier,
              open_source: provider.openSource,
              popularity_score: provider.popularityScore,
              featured: provider.featured,
              status: provider.status,
            })),
          { onConflict: 'slug' },
        )
        .select('id, slug');

      const idBySlug = new Map<string, string>();
      for (const r of (inserted ?? []) as unknown as Row[]) {
        idBySlug.set(String(r.slug), String(r.id));
      }

      await this.syncRelationsBulk(
        providersSeedData
          .filter((provider) => idBySlug.has(provider.slug))
          .map((provider) => ({
            providerId: idBySlug.get(provider.slug) ?? '',
            relations: provider,
          })),
      );

      console.log(`[supabase] provider store seeded in ${Date.now() - started}ms`);
    } catch (error) {
      console.error('[supabase] ensureSeeded failed:', error);
    }
  }

  /**
   * Migration 0004 backfill: rows seeded before the profile columns existed
   * have NULL source. Pass 1 fills rows still present in the seed file from
   * seed data; pass 2 derives a profile for legacy rows removed from the seed
   * file from their basic columns. Idempotent — once source is set the loop
   * finds nothing.
   */
  private async backfillProviderProfiles(): Promise<void> {
    const { data: legacy } = await this.client
      .from(this.t('providers'))
      .select('slug, popularity_score, pricing_model, free_tier, open_source, github, short_description')
      .is('source', null);
    const rows = (legacy ?? []) as unknown as Row[];
    if (rows.length === 0) return;

    const bySlug = new Map(providersSeedData.map((p) => [p.slug, p]));
    const nowIso = new Date().toISOString();
    const round1 = (value: number): number => Math.round(value * 10) / 10;
    const clampScore = (value: number, min: number, max: number): number =>
      Math.max(min, Math.min(max, Math.round(value)));

    let updated = 0;
    for (const row of rows) {
      const slug = String(row.slug);
      const seed = bySlug.get(slug);
      let patch: Row;
      if (seed) {
        patch = {
          community_rating: seed.communityRating ?? null,
          stack2set_rating: seed.stack2SetRating ?? null,
          monthly_cost: seed.monthlyCost ?? null,
          enterprise_pricing: seed.enterprisePricing ?? null,
          learning_curve: seed.learningCurve ?? null,
          speed: seed.speed ?? null,
          scalability: seed.scalability ?? null,
          reliability: seed.reliability ?? null,
          security: seed.security ?? null,
          compliance: seed.compliance ?? [],
          integrations: seed.integrations ?? [],
          apis: seed.apis ?? [],
          sdks: seed.sdks ?? [],
          ai_features: seed.aiFeatures ?? [],
          languages: seed.languages ?? [],
          compatibility: seed.compatibility ?? {},
          pros: seed.pros ?? [],
          cons: seed.cons ?? [],
          best_use_cases: seed.bestUseCases ?? [],
          ai_summary: seed.aiSummary ?? null,
          ai_suggested: seed.aiSuggested ?? false,
          source: seed.source ?? 'seed',
          last_synced_at: nowIso,
        };
      } else {
        const popularity = Number(row.popularity_score) || 50;
        const openSource = Boolean(row.open_source);
        const pricingModel = String(row.pricing_model ?? '');
        const freeTier = Boolean(row.free_tier);
        const communityRating = round1(3.6 + (popularity / 100) * 1.4);
        const monthlyCost = pricingModel ? pricingModelMonthlyCost(pricingModel) : 0;
        patch = {
          community_rating: communityRating,
          stack2set_rating: round1(
            Math.min(5, communityRating + (openSource ? 0.4 : 0.2)),
          ),
          monthly_cost: monthlyCost,
          enterprise_pricing:
            pricingModel && pricingModel !== 'open-source'
              ? 'Custom enterprise plans available'
              : 'Self-hosted / source available',
          learning_curve: Number(row.popularity_score) ? clampScore(5 - popularity / 25, 1, 5) : 3,
          speed: Number(row.popularity_score) ? clampScore(3 + popularity / 30, 1, 5) : 4,
          scalability: openSource ? 4 : clampScore(3 + (popularity / 100) * 2, 1, 5),
          reliability: clampScore(4 + popularity / 100, 1, 5),
          security: Boolean(row.github) || pricingModel !== 'free',
          compliance: ['SOC 2', 'GDPR'],
          integrations: [],
          apis: ['REST', 'Webhooks'],
          sdks: [],
          ai_features: [],
          languages: ['JavaScript', 'TypeScript', 'Node.js'],
          compatibility: {
            React: true,
            'Next.js': true,
            Vue: true,
            Angular: true,
            Node: true,
            Python: true,
            Java: true,
            Go: true,
            Mobile: true,
          },
          pros: [
            freeTier
              ? 'Generous free tier to get started without upfront cost'
              : 'Clear and transparent pricing model',
            openSource
              ? 'Fully open source with an active community'
              : 'Production-grade managed service with vendor support',
          ],
          cons: [
            monthlyCost > 0
              ? `Paid tier adds ~$${monthlyCost}/mo per project`
              : 'Advanced enterprise features may require a paid plan',
          ],
          best_use_cases: [],
          ai_summary: String(row.short_description ?? ''),
          ai_suggested: false,
          source: 'legacy',
          last_synced_at: nowIso,
        };
      }
      await this.client.from(this.t('providers')).update(patch).eq('slug', slug);
      updated += 1;
    }
    if (updated > 0) {
      console.log(`[supabase] backfilled profile columns for ${updated} legacy providers`);
    }
  }

  private async syncRelationsBulk(
    entries: Array<{ providerId: string; relations: Relations }>,
  ): Promise<void> {
    const withIds = entries.filter((e) => e.providerId);
    if (!withIds.length) return;
    const ids = withIds.map((e) => e.providerId);
    await Promise.all([
      this.client.from(this.t('provider_features')).delete().in('provider_id', ids),
      this.client.from(this.t('provider_tags')).delete().in('provider_id', ids),
      this.client.from(this.t('provider_alternatives')).delete().in('provider_id', ids),
    ]);

    const featureRows: Array<{ provider_id: string; feature: string }> = [];
    const tagRows: Array<{ provider_id: string; tag: string }> = [];
    for (const entry of withIds) {
      for (const feature of entry.relations.features) {
        featureRows.push({ provider_id: entry.providerId, feature });
      }
      for (const tag of entry.relations.tags) {
        tagRows.push({ provider_id: entry.providerId, tag });
      }
    }
    if (featureRows.length) {
      await this.client.from(this.t('provider_features')).insert(featureRows);
    }
    if (tagRows.length) {
      await this.client.from(this.t('provider_tags')).insert(tagRows);
    }

    const alternativeRows = await this.resolveAlternativeRows(withIds);
    if (alternativeRows.length) {
      await this.client
        .from(this.t('provider_alternatives'))
        .upsert(alternativeRows, { onConflict: 'provider_id,alternative_provider_id' });
    }
  }

  private async resolveAlternativeRows(
    entries: Array<{ providerId: string; relations: Relations }>,
  ): Promise<Array<{ provider_id: string; alternative_provider_id: string }>> {
    const altSlugs = Array.from(
      new Set(entries.flatMap((e) => e.relations.alternatives)),
    );
    if (!altSlugs.length) return [];
    const { data: altRows } = await this.client
      .from(this.t('providers'))
      .select('id, slug')
      .in('slug', altSlugs);
    const idBySlug = new Map<string, string>();
    for (const r of (altRows ?? []) as unknown as Row[]) {
      idBySlug.set(String(r.slug), String(r.id));
    }
    const rows: Array<{ provider_id: string; alternative_provider_id: string }> = [];
    for (const entry of entries) {
      for (const slug of entry.relations.alternatives) {
        const altId = idBySlug.get(slug);
        if (altId && altId !== entry.providerId) {
          rows.push({ provider_id: entry.providerId, alternative_provider_id: altId });
        }
      }
    }
    return rows;
  }

  private async mergeRelationsBulk(
    entries: Array<{ providerId: string; relations: Relations }>,
  ): Promise<void> {
    const withIds = entries.filter((e) => e.providerId);
    if (!withIds.length) return;
    const featureRows: Array<{ provider_id: string; feature: string }> = [];
    const tagRows: Array<{ provider_id: string; tag: string }> = [];
    for (const entry of withIds) {
      for (const feature of entry.relations.features) {
        featureRows.push({ provider_id: entry.providerId, feature });
      }
      for (const tag of entry.relations.tags) {
        tagRows.push({ provider_id: entry.providerId, tag });
      }
    }
    if (featureRows.length) {
      await this.client
        .from(this.t('provider_features'))
        .upsert(featureRows, { onConflict: 'provider_id,feature' });
    }
    if (tagRows.length) {
      await this.client
        .from(this.t('provider_tags'))
        .upsert(tagRows, { onConflict: 'provider_id,tag' });
    }
    const alternativeRows = await this.resolveAlternativeRows(withIds);
    if (alternativeRows.length) {
      await this.client
        .from(this.t('provider_alternatives'))
        .upsert(alternativeRows, { onConflict: 'provider_id,alternative_provider_id' });
    }
  }

  private async categoryIdBySlug(slug: string): Promise<string | null> {
    if (this.categoryIdCache.has(slug)) return this.categoryIdCache.get(slug) ?? null;
    const { data } = await this.client
      .from(this.t('categories'))
      .select('id')
      .eq('slug', slug)
      .maybeSingle();
    const id = (data as { id?: string } | null)?.id ?? null;
    this.categoryIdCache.set(slug, id);
    return id;
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
    const { data: existing } = await this.client
      .from(this.t('categories'))
      .select('id, description, aliases')
      .eq('slug', category.slug)
      .maybeSingle();
    if (existing) {
      const patch: Record<string, unknown> = {};
      const existingRow = existing as Row;
      if (!String(existingRow.description ?? '') && category.description) {
        patch.description = category.description;
      }
      const aliases = new Set<string>([
        ...((existingRow.aliases as string[]) ?? []),
        ...(category.aliases ?? []),
      ]);
      if (aliases.size !== ((existingRow.aliases as string[]) ?? []).length) {
        patch.aliases = Array.from(aliases);
      }
      if (Object.keys(patch).length) {
        await this.client.from(this.t('categories')).update(patch).eq('slug', category.slug);
      }
      return;
    }
    await this.client.from(this.t('categories')).insert({
      name: category.name,
      slug: category.slug,
      icon: category.icon,
      description: category.description ?? '',
      aliases: category.aliases ?? [],
    });
  }

  async saveProviders(categorySlug: string, providers: ProviderInput[]): Promise<void> {
    if (!providers.length) return;
    const started = Date.now();
    const categoryId = await this.categoryIdBySlug(categorySlug);
    if (!categoryId) return;

    const sanitized = providers.map(sanitizeProviderInput);

    const seenKeys = new Set<string>();
    const uniqueProviders: ProviderInput[] = [];
    for (const provider of sanitized) {
      const key =
        provider.slug || normalizeProviderName(provider.name) || provider.officialWebsite;
      if (seenKeys.has(key)) continue;
      seenKeys.add(key);
      uniqueProviders.push(provider);
    }

    const { data: existingRows } = await this.client
      .from(this.t('providers'))
      .select(PROVIDER_COLUMNS);
    const existing = (existingRows ?? []) as Row[];

    const bySlug = new Map<string, Row>();
    const byName = new Map<string, Row>();
    const byWebsite = new Map<string, Row>();
    for (const row of existing) {
      bySlug.set(String(row.slug), row);
      const nameKey = normalizeProviderName(String(row.name));
      if (nameKey && !byName.has(nameKey)) byName.set(nameKey, row);
      const websiteKey = row.official_website
        ? normalizeWebsiteForMatch(String(row.official_website))
        : '';
      if (websiteKey && !byWebsite.has(websiteKey)) byWebsite.set(websiteKey, row);
    }

    const toInsert: ProviderInput[] = [];
    const toUpdate: Array<{ row: Row; input: ProviderInput }> = [];
    for (const input of uniqueProviders) {
      const nameKey = normalizeProviderName(input.name);
      const websiteKey = input.officialWebsite
        ? normalizeWebsiteForMatch(input.officialWebsite)
        : '';
      const match =
        bySlug.get(input.slug) ??
        byName.get(nameKey) ??
        (websiteKey ? byWebsite.get(websiteKey) : undefined);
      if (match) {
        toUpdate.push({ row: match, input });
      } else {
        toInsert.push(input);
      }
    }

    const newIds = new Map<string, string>();
    if (toInsert.length) {
      const { data: inserted, error: insertError } = await this.client
        .from(this.t('providers'))
        .insert(
          toInsert.map((provider) => ({
            category_id: categoryId,
            name: provider.name,
            slug: provider.slug,
            short_description: provider.shortDescription,
            long_description: provider.longDescription,
            logo: provider.logo,
            official_website: provider.officialWebsite || '',
            documentation: provider.documentation || '',
            github: provider.github,
            pricing_model: provider.pricingModel,
            free_tier: provider.freeTier,
            open_source: provider.openSource,
            popularity_score: provider.popularityScore,
            featured: provider.featured,
            status: provider.status,
            ai_suggested: provider.aiSuggested ?? false,
          })),
        )
        .select('id, slug');
      if (insertError) {
        console.error(`[supabase] saveProviders insert failed: ${insertError.message}`);
      }
      for (const r of (inserted ?? []) as unknown as Row[]) {
        newIds.set(String(r.slug), String(r.id));
      }
    }

    for (const { row, input } of toUpdate) {
      const patch = this.mergeProviderPatch(row, input);
      if (Object.keys(patch).length) {
        await this.client.from(this.t('providers')).update(patch).eq('id', row.id);
      }
    }

    const linkRows: Array<{ provider_id: string; category_id: string }> = [];
    for (const provider of toInsert) {
      const id = newIds.get(provider.slug);
      if (id) linkRows.push({ provider_id: id, category_id: categoryId });
    }
    for (const { row } of toUpdate) {
      if (String(row.category_id) !== categoryId) {
        linkRows.push({ provider_id: String(row.id), category_id: categoryId });
      }
    }
    if (linkRows.length) {
      await this.client
        .from(this.t('provider_categories'))
        .upsert(linkRows, { onConflict: 'provider_id,category_id' });
    }

    await this.syncRelationsBulk(
      toInsert.map((provider) => ({
        providerId: newIds.get(provider.slug) ?? '',
        relations: provider,
      })),
    );
    await this.mergeRelationsBulk(
      toUpdate.map(({ row, input }) => ({
        providerId: String(row.id),
        relations: input,
      })),
    );

    console.log(
      `[supabase] saveProviders for ${categorySlug}: ${toInsert.length} inserted, ${toUpdate.length} merged (${Date.now() - started}ms)`,
    );
  }

  private mergeProviderPatch(row: Row, input: ProviderInput): Record<string, unknown> {
    const fill = (existing: unknown, incoming: unknown): unknown => {
      const existingValue = existing == null ? '' : String(existing);
      const incomingValue = incoming == null ? '' : String(incoming);
      return existingValue || incomingValue;
    };
    const merged: Record<string, unknown> = {
      name: fill(row.name, input.name) || input.name,
      slug: String(row.slug),
      category_id: String(row.category_id),
      short_description: fill(row.short_description, input.shortDescription),
      long_description: fill(row.long_description, input.longDescription),
      logo: row.logo ?? input.logo ?? null,
      official_website: fill(row.official_website, input.officialWebsite),
      documentation: fill(row.documentation, input.documentation),
      github: row.github ?? input.github ?? null,
      pricing_model: fill(row.pricing_model, input.pricingModel) || 'freemium',
      free_tier: (row.free_tier as boolean) ?? input.freeTier ?? false,
      open_source: (row.open_source as boolean) ?? input.openSource ?? false,
      popularity_score: (row.popularity_score as number) ?? input.popularityScore ?? 50,
      featured: (row.featured as boolean) ?? input.featured ?? false,
      status: fill(row.status, input.status) || 'active',
      ai_suggested: (row.ai_suggested as boolean) ?? input.aiSuggested ?? false,
    };

    const patch: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(merged)) {
      const current = row[key];
      const isEmpty = (x: unknown) => x == null || x === '';
      if (isEmpty(value)) continue;
      if (isEmpty(current) && String(current) !== String(value)) {
        patch[key] = value;
      }
    }
    return patch;
  }
}
