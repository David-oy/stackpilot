import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import type { StackCategory, UserStack } from './types';

type StackRow = {
  id: string;
  client_id: string;
  name: string;
  prompt: string;
  source_analysis: UserStack['sourceAnalysis'];
  created_at: string;
  updated_at: string;
};

type StackItemRow = {
  stack_id: string;
  category_id: string;
  category_name: string;
  category_position: number;
  collapsed: boolean;
  provider_snapshot: Record<string, unknown>;
  position: number;
};

export function mergeStacks(local: UserStack[], cloud: UserStack[]): UserStack[] {
  const byId = new Map<string, UserStack>();
  for (const stack of local) byId.set(stack.id, stack);
  for (const stack of cloud) {
    const existing = byId.get(stack.id);
    if (!existing || (existing.updatedAt ?? '') < (stack.updatedAt ?? '')) {
      byId.set(stack.id, stack);
    }
  }
  return [...byId.values()].sort((a, b) => ((b.updatedAt ?? '') < (a.updatedAt ?? '') ? -1 : 1));
}

export function localOnlyStacks(local: UserStack[], cloud: UserStack[]): UserStack[] {
  const cloudIds = new Set(cloud.map((s) => s.id));
  return local.filter((s) => !cloudIds.has(s.id));
}

function toRow(stack: UserStack, userId: string): Omit<StackRow, 'id'> {
  return {
    client_id: stack.id,
    name: stack.name,
    prompt: stack.prompt ?? '',
    source_analysis: stack.sourceAnalysis ?? null,
    created_at: stack.createdAt,
    updated_at: stack.updatedAt,
  };
}

function toItemRows(stack: UserStack): Omit<StackItemRow, 'stack_id'>[] {
  const rows: Omit<StackItemRow, 'stack_id'>[] = [];
  stack.categories.forEach((cat, categoryIndex) => {
    cat.providers.forEach((provider, providerIndex) => {
      rows.push({
        category_id: cat.categoryId,
        category_name: cat.categoryName,
        category_position: categoryIndex,
        collapsed: cat.collapsed,
        provider_snapshot: provider as unknown as Record<string, unknown>,
        position: providerIndex,
      });
    });
  });
  return rows;
}

function fromRow(stack: StackRow, items: StackItemRow[]): UserStack {
  const sorted = [...items].sort(
    (a, b) => a.category_position - b.category_position || a.position - b.position,
  );
  const categories: StackCategory[] = [];
  for (const item of sorted) {
    let category = categories[categories.length - 1];
    if (
      !category ||
      category.categoryId !== item.category_id ||
      categories.length !== item.category_position + 1
    ) {
      category = {
        categoryId: item.category_id,
        categoryName: item.category_name,
        collapsed: item.collapsed,
        providers: [],
      };
      categories.push(category);
    }
    category.providers.push(item.provider_snapshot as StackCategory['providers'][number]);
  }
  return {
    id: stack.client_id,
    name: stack.name,
    prompt: stack.prompt ?? '',
    createdAt: stack.created_at,
    updatedAt: stack.updated_at,
    sourceAnalysis: stack.source_analysis ?? null,
    categories,
  };
}

export async function listCloudStacks(userId: string): Promise<UserStack[]> {
  if (!isSupabaseConfigured) return [];
  const client = createClient();
  const { data: stackRows, error: stackError } = await client
    .from('stacks')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });
  if (stackError) throw stackError;
  if (!stackRows || stackRows.length === 0) return [];

  const stackIds = stackRows.map((r) => r.id);
  const { data: itemRows, error: itemError } = await client
    .from('stack_items')
    .select('*')
    .in('stack_id', stackIds);
  if (itemError) throw itemError;

  const itemsByStack = new Map<string, StackItemRow[]>();
  for (const item of (itemRows ?? []) as unknown as StackItemRow[]) {
    const list = itemsByStack.get(item.stack_id) ?? [];
    list.push(item);
    itemsByStack.set(item.stack_id, list);
  }

  return (stackRows as unknown as StackRow[]).map((row) =>
    fromRow(row, itemsByStack.get(row.id) ?? []),
  );
}

export async function upsertCloudStack(userId: string, stack: UserStack): Promise<void> {
  if (!isSupabaseConfigured) return;
  const client = createClient();
  const { data, error } = await client
    .from('stacks')
    .upsert({ user_id: userId, ...toRow(stack, userId) }, { onConflict: 'user_id,client_id' })
    .select('id')
    .single();
  if (error) throw error;
  const stackId = (data as { id?: string } | null)?.id;
  if (!stackId) return;

  const { error: deleteError } = await client
    .from('stack_items')
    .delete()
    .eq('stack_id', stackId);
  if (deleteError) throw deleteError;

  const itemRows = toItemRows(stack).map((row) => ({ stack_id: stackId, ...row }));
  if (itemRows.length > 0) {
    const { error: insertError } = await client.from('stack_items').insert(itemRows);
    if (insertError) throw insertError;
  }
}

export async function pushStacksToCloud(userId: string, stacks: UserStack[]): Promise<void> {
  if (!isSupabaseConfigured) return;
  for (const stack of stacks) {
    await upsertCloudStack(userId, stack);
  }
}

export async function deleteCloudStack(userId: string, stackId: string): Promise<void> {
  if (!isSupabaseConfigured) return;
  const client = createClient();
  const { error } = await client
    .from('stacks')
    .delete()
    .eq('user_id', userId)
    .eq('client_id', stackId);
  if (error) throw error;
}
