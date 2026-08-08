import type { Metadata } from 'next';
import { SavedStacksPage } from '@/components/workspace/saved-stacks-page';
import { WorkspaceShell } from '@/components/workspace/workspace-shell';

export const metadata: Metadata = {
  title: 'Saved Stacks',
  description: 'Browse, open, and manage all of your saved technology stacks.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function SavedStacksPageRoute() {
  return (
    <WorkspaceShell>
      <SavedStacksPage />
    </WorkspaceShell>
  );
}
