import type { Metadata } from 'next';
import { WorkspaceHistory } from '@/components/workspace/history';

export const metadata: Metadata = {
  title: 'History',
  description: 'Your recent searches and stacks.',
};

export default function HistoryPage() {
  return <WorkspaceHistory />;
}
