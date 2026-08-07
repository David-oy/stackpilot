import { z } from 'zod';
import type { UserStack } from './types';
import { STACK_EXPORT_TYPE, STACK_EXPORT_VERSION } from './types';

export const STACKS_KEY = 'stack2set:stacks';
export const ACTIVE_STACK_KEY = 'stack2set:active-stack';
export const MAX_RECENT_STACKS = 20;

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

export class LocalStorageStackRepository implements StackRepository {
  private storage: StorageLike;

  constructor(storage: StorageLike = getDefaultStorage()) {
    this.storage = storage;
  }

  list(): UserStack[] {
    const stacks = safeParse<UserStack[]>(this.storage.getItem(STACKS_KEY), z.array(userStackSchema));
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
    this.write(stacks, trimmed);
  }

  delete(id: string): void {
    const stacks = this.list();
    const next = stacks.filter((s) => s.id !== id);
    this.write(stacks, next);
    if (this.getActiveId() === id) {
      this.setActiveId(null);
    }
  }

  clear(): void {
    try {
      this.storage.removeItem(STACKS_KEY);
    } catch {
      // ignore
    }
  }

  getActiveId(): string | null {
    try {
      return this.storage.getItem(ACTIVE_STACK_KEY);
    } catch {
      return null;
    }
  }

  setActiveId(id: string | null): void {
    try {
      if (id) this.storage.setItem(ACTIVE_STACK_KEY, id);
      else this.storage.removeItem(ACTIVE_STACK_KEY);
    } catch {
      // ignore
    }
  }

  private write(_previous: UserStack[], next: UserStack[]): void {
    try {
      this.storage.setItem(STACKS_KEY, JSON.stringify(next));
    } catch {
      // ignore quota / privacy mode errors
    }
  }
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
