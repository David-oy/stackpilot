import type { SharePayload } from './types';
import { generateId } from './id';

export const SHARE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

/**
 * Share store abstraction. Phase 3 ships an in-memory implementation; a
 * Supabase-backed implementation can replace it in Phase 4 without touching
 * the API or UI code.
 */
export interface ShareRepository {
  create(payload: Omit<SharePayload, 'id' | 'createdAt'>): SharePayload;
  get(id: string): SharePayload | null;
}

type StoredShare = {
  payload: SharePayload;
  expiresAt: number;
};

export class InMemoryShareRepository implements ShareRepository {
  private store = new Map<string, StoredShare>();

  create(payload: Omit<SharePayload, 'id' | 'createdAt'>): SharePayload {
    const id = generateId(10);
    const record: SharePayload = {
      ...payload,
      id,
      createdAt: new Date().toISOString(),
    };
    this.store.set(id, { payload: record, expiresAt: Date.now() + SHARE_TTL_MS });
    return record;
  }

  get(id: string): SharePayload | null {
    const stored = this.store.get(id);
    if (!stored) return null;
    if (Date.now() > stored.expiresAt) {
      this.store.delete(id);
      return null;
    }
    return stored.payload;
  }
}

let instance: ShareRepository | null = null;

export function getShareRepository(): ShareRepository {
  if (!instance) {
    instance = new InMemoryShareRepository();
  }
  return instance;
}
