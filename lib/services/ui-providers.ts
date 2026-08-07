import type { Provider } from '@/lib/providers';
import type { ProviderWithRelations } from '@/lib/db/schema';

const LOGO_GRADIENTS = [
  'from-violet-500 to-purple-500',
  'from-blue-500 to-cyan-500',
  'from-emerald-500 to-teal-500',
  'from-amber-500 to-orange-500',
  'from-pink-500 to-rose-500',
  'from-sky-500 to-indigo-500',
  'from-fuchsia-500 to-pink-500',
];

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

const BEGINNER_HINTS = /beginner|easy|quick to start|low barrier|starter/i;

export function toUiProvider(provider: ProviderWithRelations): Provider {
  const tags = [...(provider.tags ?? [])];
  const beginnerFriendly =
    BEGINNER_HINTS.test((provider.features ?? []).join(' ')) || provider.popularityScore >= 80;

  return {
    id: provider.slug,
    name: provider.name,
    description: provider.shortDescription,
    tags,
    freeTier: provider.freeTier,
    openSource: provider.openSource,
    paid: provider.pricingModel !== 'free' && provider.pricingModel !== 'open-source',
    beginnerFriendly,
    popular: provider.popularityScore >= 75 || provider.featured,
    logoColor: LOGO_GRADIENTS[hashString(provider.slug) % LOGO_GRADIENTS.length],
    logoText: provider.name.charAt(0).toUpperCase(),
  };
}

export function toUiProviders(providers: ProviderWithRelations[]): Provider[] {
  return providers.map(toUiProvider);
}
