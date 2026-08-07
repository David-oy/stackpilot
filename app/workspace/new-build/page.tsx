import type { Metadata } from 'next';
import { NewBuild } from '@/components/workspace/new-build';

export const metadata: Metadata = {
  title: 'New Build',
  description:
    'Describe your project and Stack2Set will research the best providers and build your stack.',
};

export default function NewBuildPage() {
  return <NewBuild />;
}
