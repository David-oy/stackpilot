import type { Metadata } from 'next';
import { SearchPage } from '@/components/search/search-page';

export const metadata: Metadata = {
  title: 'Search',
  description:
    'Describe your project and Stack2Set will build your technology stack. Sign in to generate personalized results.',
};

export default function SearchRoute() {
  return <SearchPage />;
}
