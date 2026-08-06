import { slugify } from './seed/helpers';
import type { PricingModel } from './schema';
import type { ProviderInput } from './store';

const VALID_PRICING_MODELS: PricingModel[] = [
  'free',
  'freemium',
  'usage-based',
  'subscription',
  'per-seat',
  'open-source',
];

export function normalizeProviderName(name: string): string {
  return (name ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[^a-z0-9]+/g, '');
}

export function normalizeWebsiteForMatch(value: string): string {
  return (value ?? '')
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/+$/, '');
}

function sanitizeUrl(value: string | null | undefined): string {
  if (!value) return '';
  const trimmed = value.trim();
  if (!/^https?:\/\/[^\s]+$/i.test(trimmed)) return '';
  return trimmed;
}

function cleanText(value: string | undefined, maxLength: number): string {
  if (!value) return '';
  return value.trim().replace(/\s+/g, ' ').slice(0, maxLength);
}

function cleanList(values: string[] | undefined, maxItems: number, maxLength: number): string[] {
  if (!Array.isArray(values)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of values) {
    const item = (raw ?? '').trim();
    if (!item || item.length > maxLength) continue;
    const key = item.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
    if (out.length >= maxItems) break;
  }
  return out;
}

export function sanitizeProviderInput(input: ProviderInput): ProviderInput {
  const name = cleanText(input.name, 120);
  const rawSlug = (input.slug ?? '').trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
  const slug = rawSlug.slice(0, 60) || slugify(name) || 'provider';
  const pricing = (input.pricingModel ?? '').toLowerCase();
  const popularity = Number.isFinite(input.popularityScore)
    ? Math.min(100, Math.max(1, Math.round(input.popularityScore)))
    : 50;

  return {
    ...input,
    name: name || input.name,
    slug,
    categoryId: input.categoryId,
    shortDescription: cleanText(input.shortDescription, 240),
    longDescription: cleanText(input.longDescription, 2400),
    logo: sanitizeUrl(input.logo) || null,
    officialWebsite: sanitizeUrl(input.officialWebsite),
    documentation: sanitizeUrl(input.documentation),
    github: sanitizeUrl(input.github) || null,
    pricingModel: (VALID_PRICING_MODELS as string[]).includes(pricing)
      ? (pricing as PricingModel)
      : 'freemium',
    freeTier: Boolean(input.freeTier),
    openSource: Boolean(input.openSource),
    popularityScore: popularity,
    featured: Boolean(input.featured),
    status: input.status === 'inactive' || input.status === 'deprecated' ? input.status : 'active',
    features: cleanList(input.features, 10, 120),
    tags: cleanList(input.tags, 10, 60),
    alternatives: cleanList(input.alternatives, 8, 60),
  };
}
