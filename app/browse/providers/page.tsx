import type { Metadata } from 'next';
import { BrowseProviders } from '@/components/browse/providers';

export const metadata: Metadata = {
  title: 'Browse Providers',
  description:
    'Browse and compare providers from the Stack2Set database. Filter by category, pricing, and more.',
};

export default function BrowseProvidersPage() {
  return <BrowseProviders />;
}
