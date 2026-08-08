import type { Metadata } from 'next';
import { NewBuild } from '@/components/workspace/new-build';
import { WorkspaceShell } from '@/components/workspace/workspace-shell';

export const metadata: Metadata = {
  title: 'New Build',
  description:
    'Describe your project and Stack2Set will research the best providers and build your stack.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function NewBuildPage() {
  return (
    <WorkspaceShell>
      <NewBuild />
    </WorkspaceShell>
  );
}
