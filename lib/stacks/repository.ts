import { z } from 'zod';
import type { UserStack } from './types';
import { STACK_EXPORT_TYPE, STACK_EXPORT_VERSION } from './types';

export const STACKS_KEY = 'stack2set:stacks';
export const ACTIVE_STACK_KEY = 'stack2set:active-stack';
export const MAX_RECENT_STACKS = 20;
/** Guards the one-time move of the legacy global storage into a workspace scope. */
export const LEGACY_MIGRATION_FLAG = 'stack2set:stacks-migrated';

/**
 * Storage abstraction — swap for Supabase/Postgres in a later phase without
 * touching the UI. UI code should only ever talk to this interface.
 */
export interface StackRepository {
  list(): UserStack[];
  get(id: string): UserStack | null;
  save(stack: UserStack): void;
  delete(id: string): void;
  clear(): void;
  getActiveId(): string | null;
  setActiveId(id: string | null): void;
}

export type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export const stackProviderSchema = z.object({
  providerId: z.string().min(1),
  name: z.string().min(1),
  description: z.string().default(''),
  reason: z.string().optional(),
  website: z.string().optional(),
  documentation: z.string().optional(),
  github: z.string().optional(),
  pricingModel: z.string().optional(),
  popularityScore: z.number().optional(),
  freeTier: z.boolean().optional(),
  openSource: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  features: z.array(z.string()).optional(),
  addedAt: z.string(),
});

export const stackCategorySchema = z.object({
  categoryId: z.string().min(1),
  categoryName: z.string().min(1),
  collapsed: z.boolean().default(false),
  providers: z.array(stackProviderSchema).default([]),
});

export const userStackSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  prompt: z.string().default(''),
  createdAt: z.string(),
  updatedAt: z.string(),
  sourceAnalysis: z.record(z.unknown()).nullable().optional(),
  health: z.record(z.unknown()).nullable().optional(),
  categories: z.array(stackCategorySchema).default([]),
});

export const stackExportSchema = z.object({
  type: z.literal(STACK_EXPORT_TYPE),
  version: z.literal(STACK_EXPORT_VERSION),
  exportedAt: z.string(),
  stack: userStackSchema,
  health: z.record(z.unknown()).optional(),
});

function safeParse<T>(raw: string | null, schema: z.ZodTypeAny): T | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    const result = schema.safeParse(parsed);
    return result.success ? (result.data as T) : null;
  } catch {
    return null;
  }
}

function sortByUpdatedAt(stacks: UserStack[]): UserStack[] {
  return [...stacks].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
}

function getDefaultStorage(): StorageLike {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  return {
    getItem: () => null,
    setItem: () => undefined,
    removeItem: () => undefined,
  };
}

function workspaceStorageKey(base: string, workspaceId: string): string {
  return `${base}:${workspaceId}`;
}

/**
 * Per-workspace localStorage repository. Each workspace keeps its own stacks
 * list + active stack under `stack2set:stacks:{workspaceId}`. On first use it
 * migrates the legacy global `stack2set:stacks` blob (pre-workspaces data)
 * into the current workspace so existing on-device stacks keep working.
 */
export class ScopedStackRepository implements StackRepository {
  private storage: StorageLike;
  private workspaceId: string;

  constructor(workspaceId: string, storage: StorageLike = getDefaultStorage()) {
    this.workspaceId = workspaceId;
    this.storage = storage;
    this.migrateLegacy();
  }

  private stacksKey(): string {
    return workspaceStorageKey(STACKS_KEY, this.workspaceId);
  }

  private activeKey(): string {
    return workspaceStorageKey(ACTIVE_STACK_KEY, this.workspaceId);
  }

  private migrateLegacy(): void {
    try {
      if (this.storage.getItem(LEGACY_MIGRATION_FLAG)) return;
      const legacy = this.storage.getItem(STACKS_KEY);
      if (legacy !== null && this.storage.getItem(this.stacksKey()) === null) {
        this.storage.setItem(this.stacksKey(), legacy);
        const legacyActive = this.storage.getItem(ACTIVE_STACK_KEY);
        if (legacyActive !== null) this.storage.setItem(this.activeKey(), legacyActive);
      }
      this.storage.setItem(LEGACY_MIGRATION_FLAG, '1');
    } catch {
      // ignore
    }
  }

  list(): UserStack[] {
    const stacks = safeParse<UserStack[]>(
      this.storage.getItem(this.stacksKey()),
      z.array(userStackSchema),
    );
    return sortByUpdatedAt(stacks ?? []).slice(0, MAX_RECENT_STACKS);
  }

  get(id: string): UserStack | null {
    const stacks = this.list();
    return stacks.find((s) => s.id === id) ?? null;
  }

  save(stack: UserStack): void {
    const stacks = this.list();
    const index = stacks.findIndex((s) => s.id === stack.id);
    if (index >= 0) {
      stacks[index] = stack;
    } else {
      stacks.push(stack);
    }
    const trimmed = sortByUpdatedAt(stacks).slice(0, MAX_RECENT_STACKS);
    this.write(trimmed);
  }

  delete(id: string): void {
    const stacks = this.list();
    const next = stacks.filter((s) => s.id !== id);
    this.write(next);
    if (this.getActiveId() === id) {
      this.setActiveId(null);
    }
  }

  clear(): void {
    try {
      this.storage.removeItem(this.stacksKey());
    } catch {
      // ignore
    }
  }

  getActiveId(): string | null {
    try {
      return this.storage.getItem(this.activeKey());
    } catch {
      return null;
    }
  }

  setActiveId(id: string | null): void {
    try {
      if (id) this.storage.setItem(this.activeKey(), id);
      else this.storage.removeItem(this.activeKey());
    } catch {
      // ignore
    }
  }

  private write(next: UserStack[]): void {
    try {
      this.storage.setItem(this.stacksKey(), JSON.stringify(next));
    } catch {
      // ignore quota / privacy mode errors
    }
  }
}
