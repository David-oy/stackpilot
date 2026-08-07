import { Metadata } from 'next';
import { WorkspaceView } from '@/components/workspace/workspace-view';

export const metadata: Metadata = {
  title: 'Workspace',
  description:
    'Build, compare, and share your perfect technology stack. Your stack is saved automatically and synced to your account when signed in.',
};

export default function WorkspacePage() {
  return <WorkspaceView />;
}
