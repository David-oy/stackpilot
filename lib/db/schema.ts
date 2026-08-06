export type ProviderStatus = 'active' | 'inactive' | 'deprecated';

export type PricingModel =
  | 'free'
  | 'freemium'
  | 'usage-based'
  | 'subscription'
  | 'per-seat'
  | 'open-source';

export type CategoryRecord = {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description: string;
  aliases?: string[];
  createdAt: string;
  updatedAt: string;
};

export type ProviderRecord = {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  shortDescription: string;
  longDescription: string;
  logo: string | null;
  officialWebsite: string;
  documentation: string;
  github: string | null;
  pricingModel: PricingModel;
  freeTier: boolean;
  openSource: boolean;
  popularityScore: number;
  featured: boolean;
  status: ProviderStatus;
  createdAt: string;
  updatedAt: string;
};

export type ProviderFeature = {
  id: string;
  providerId: string;
  feature: string;
};

export type ProviderTag = {
  id: string;
  providerId: string;
  tag: string;
};

export type ProviderAlternative = {
  providerId: string;
  alternativeProviderId: string;
};

export type ProviderWithRelations = ProviderRecord & {
  features: string[];
  tags: string[];
  alternatives: string[];
};
