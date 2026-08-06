import type { CategoryRecord, ProviderWithRelations } from '../schema';
import { categoriesSeed } from './categories';
import { coreProviders } from './providers-core';
import { servicesProviders } from './providers-services';
import { aiProviders } from './providers-ai';
import { opsProviders } from './providers-ops';

export const categoriesSeedData: CategoryRecord[] = categoriesSeed;

export const providersSeedData: ProviderWithRelations[] = [
  ...coreProviders,
  ...servicesProviders,
  ...aiProviders,
  ...opsProviders,
];
