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
  // --- Extended profile (used by detail pages + comparison) ---
  communityRating?: number;
  stack2SetRating?: number;
  monthlyCost?: number;
  enterprisePricing?: string;
  learningCurve?: number;
  speed?: number;
  scalability?: number;
  reliability?: number;
  security?: boolean;
  compliance?: string[];
  integrations?: string[];
  apis?: string[];
  sdks?: string[];
  aiFeatures?: string[];
  languages?: string[];
  compatibility?: Record<string, boolean>;
  pros?: string[];
  cons?: string[];
  bestUseCases?: string[];
  aiSummary?: string;
  // --- Sync metadata (48h sync service) ---
  aiSuggested?: boolean;
  source?: string;
  lastSyncedAt?: string;
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
