export type Workspace = {
  id: string;
  userId: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  createdAt: string;
  updatedAt: string;
  lastOpenedAt: string;
  archivedAt: string | null;
};

export type WorkspaceInput = {
  name: string;
  description?: string;
  icon: string;
  color: string;
};

/** Accent color choices shown in the create/rename dialog. */
export const WORKSPACE_COLORS = [
  '#8b5cf6',
  '#3b82f6',
  '#06b6d4',
  '#10b981',
  '#84cc16',
  '#f59e0b',
  '#f97316',
  '#ef4444',
  '#ec4899',
] as const;

export const WORKSPACE_ICONS = [
  '🚀',
  '💻',
  '📊',
  '🎯',
  '🛠️',
  '🌐',
  '📱',
  '🎨',
  '⚡',
  '🧠',
  '🔒',
  '📦',
] as const;

export const DEFAULT_WORKSPACE_COLOR = '#8b5cf6';
export const DEFAULT_WORKSPACE_ICON = '🚀';

/**
 * The stable workspace id used while signed out. It is a single local-only
 * workspace; on sign-in its stacks migrate into the account's default
 * workspace.
 */
export const LOCAL_WORKSPACE_ID = 'local-default';
