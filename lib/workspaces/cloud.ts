import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import type { Workspace, WorkspaceInput } from './types';

type WorkspaceRow = {
  id: string;
  user_id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  created_at: string;
  updated_at: string;
  last_opened_at: string;
  archived_at: string | null;
};

function fromRow(row: WorkspaceRow): Workspace {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    description: row.description,
    icon: row.icon,
    color: row.color,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastOpenedAt: row.last_opened_at,
    archivedAt: row.archived_at,
  };
}

export async function listWorkspaces(userId: string): Promise<Workspace[]> {
  if (!isSupabaseConfigured) return [];
  const client = createClient();
  const { data, error } = await client
    .from('workspaces')
    .select('*')
    .eq('user_id', userId)
    .is('archived_at', null)
    .order('last_opened_at', { ascending: false });
  if (error) throw error;
  return ((data ?? []) as unknown as WorkspaceRow[]).map(fromRow);
}

export async function createWorkspace(
  userId: string,
  input: WorkspaceInput,
): Promise<Workspace | null> {
  if (!isSupabaseConfigured) return null;
  const client = createClient();
  const { data, error } = await client
    .from('workspaces')
    .insert({
      user_id: userId,
      name: input.name,
      description: input.description ?? '',
      icon: input.icon,
      color: input.color,
    })
    .select()
    .single();
  if (error) throw error;
  return data ? fromRow(data as unknown as WorkspaceRow) : null;
}

export async function updateWorkspace(
  userId: string,
  workspaceId: string,
  patch: Partial<WorkspaceInput> & { archivedAt?: string | null },
): Promise<void> {
  if (!isSupabaseConfigured) return;
  const client = createClient();
  const payload: Record<string, unknown> = {};
  if (patch.name !== undefined) payload.name = patch.name;
  if (patch.description !== undefined) payload.description = patch.description;
  if (patch.icon !== undefined) payload.icon = patch.icon;
  if (patch.color !== undefined) payload.color = patch.color;
  if (patch.archivedAt !== undefined) payload.archived_at = patch.archivedAt;
  if (Object.keys(payload).length === 0) return;
  const { error } = await client
    .from('workspaces')
    .update(payload)
    .eq('id', workspaceId)
    .eq('user_id', userId);
  if (error) throw error;
}

export async function deleteWorkspace(userId: string, workspaceId: string): Promise<void> {
  if (!isSupabaseConfigured) return;
  const client = createClient();
  const { error } = await client
    .from('workspaces')
    .delete()
    .eq('id', workspaceId)
    .eq('user_id', userId);
  if (error) throw error;
}

export async function setLastOpened(userId: string, workspaceId: string): Promise<void> {
  if (!isSupabaseConfigured) return;
  const client = createClient();
  await client
    .from('workspaces')
    .update({ last_opened_at: new Date().toISOString() })
    .eq('id', workspaceId)
    .eq('user_id', userId);
}
