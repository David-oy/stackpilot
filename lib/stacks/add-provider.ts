import type { ProviderWithRelations } from '@/lib/db/schema';
import type { StackProviderInput, UserStack } from './types';

/** Normalize a provider name for duplicate detection (e.g. "React.js" == "reactjs"). */
export function normalizeProviderKey(name: string): string {
  return (name ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[^a-z0-9]+/g, '');
}

/** Normalize a domain for duplicate detection (e.g. "https://www.Upstash.com/" == "upstash.com"). */
export function normalizeDomainKey(value: string): string {
  return (value ?? '')
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/+$/, '');
}

export function isProviderInCategory(
  stack: UserStack | null,
  categoryId: string,
  name: string,
  website?: string,
): boolean {
  if (!stack) return false;
  const nameKey = normalizeProviderKey(name);
  const domainKey = website ? normalizeDomainKey(website) : '';
  if (!nameKey && !domainKey) return false;
  const category = stack.categories.find((c) => c.categoryId === categoryId);
  if (!category) return false;
  return category.providers.some((p) => {
    if (nameKey && normalizeProviderKey(p.name) === nameKey) return true;
    if (domainKey && p.website && normalizeDomainKey(p.website) === domainKey) return true;
    return false;
  });
}

/** Convert a catalog provider into a stack provider snapshot. */
export function providerInputFromCatalog(provider: ProviderWithRelations): StackProviderInput {
  const focus = (provider.tags ?? [])[0]
    ? `Strong fit for ${provider.tags[0].toLowerCase()}.`
    : 'A well-supported option for your stack.';
  return {
    providerId: provider.slug,
    name: provider.name,
    description: provider.shortDescription || provider.longDescription,
    reason: provider.aiSummary || focus,
    website: provider.officialWebsite || undefined,
    documentation: provider.documentation || undefined,
    github: provider.github || undefined,
    pricingModel: provider.pricingModel,
    popularityScore: provider.popularityScore,
    freeTier: provider.freeTier,
    openSource: provider.openSource,
    tags: provider.tags ?? [],
    features: provider.features ?? [],
    aiSuggested: provider.aiSuggested,
  };
}

export type PersistProviderPayload = {
  categoryId: string;
  name: string;
  description: string;
  website?: string;
  documentation?: string;
  tags?: string[];
  reason?: string;
  aiSuggested?: boolean;
};

export type PersistProviderResult = {
  created: boolean;
  duplicate: boolean;
  error?: string;
};

/** Persist a provider into the shared catalog. Returns duplicate/created state. */
export async function persistProviderToCatalog(
  payload: PersistProviderPayload,
): Promise<PersistProviderResult> {
  try {
    const res = await fetch('/api/providers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = (await res.json().catch(() => ({}))) as {
      created?: boolean;
      duplicate?: boolean;
      error?: string;
    };
    if (!res.ok) {
      return { created: false, duplicate: false, error: data?.error ?? 'Could not save provider.' };
    }
    return { created: Boolean(data.created), duplicate: Boolean(data.duplicate) };
  } catch {
    return { created: false, duplicate: false, error: 'Could not save provider.' };
  }
}

/** Build a tag list from a comma-separated string, cleaned and deduped. */
export function splitTags(raw: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of (raw ?? '').split(',')) {
    const clean = item.trim().toLowerCase();
    if (!clean || clean.length > 40 || seen.has(clean)) continue;
    seen.add(clean);
    out.push(clean);
    if (out.length >= 8) break;
  }
  return out;
}

/** Validate a website string; returns a normalized URL or null when invalid. */
export function normalizeWebsite(raw: string): string | null {
  const trimmed = (raw ?? '').trim();
  if (!trimmed) return null;
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const url = new URL(withProtocol);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    if (!url.hostname.includes('.') && url.hostname !== 'localhost') return null;
    return url.toString().replace(/\/$/, '');
  } catch {
    return null;
  }
}
