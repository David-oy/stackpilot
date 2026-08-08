import type { Metadata } from 'next';
import { WorkspaceHistory } from '@/components/workspace/history';
import { WorkspaceShell } from '@/components/workspace/workspace-shell';

export const metadata: Metadata = {
  title: 'History',
  description: 'Your recent searches and stacks.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function HistoryPage() {
  return (
    <WorkspaceShell>
      <WorkspaceHistory />
    </WorkspaceShell>
  );
}
