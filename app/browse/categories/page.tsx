import type { Metadata } from 'next';
import { BrowseCategories } from '@/components/browse/categories';

export const metadata: Metadata = {
  title: 'Browse Categories',
  description:
    'Explore technology categories — from frontend and backend to AI, payments, and video APIs.',
};

export default function BrowseCategoriesPage() {
  return <BrowseCategories />;
}
