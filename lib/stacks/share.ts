import type { SharePayload } from './types';
import { generateId } from './id';
import { createAdminClient } from '@/lib/supabase/server';

export const SHARE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

/**
 * Share store abstraction. The production implementation persists shares to
 * Supabase (so links survive serverless cold starts and multiple instances);
 * it degrades to in-memory storage when the database is unreachable so share
 * creation never hard-fails for the user.
 */
export interface ShareRepository {
  create(payload: Omit<SharePayload, 'id' | 'createdAt'>): Promise<SharePayload>;
  get(id: string): Promise<SharePayload | null>;
}

type StoredShare = {
  payload: SharePayload;
  expiresAt: number;
};

export class InMemoryShareRepository implements ShareRepository {
  private store = new Map<string, StoredShare>();

  async create(payload: Omit<SharePayload, 'id' | 'createdAt'>): Promise<SharePayload> {
    const id = generateId(10);
    const record: SharePayload = {
      ...payload,
      id,
      createdAt: new Date().toISOString(),
    };
    this.store.set(id, { payload: record, expiresAt: Date.now() + SHARE_TTL_MS });
    return record;
  }

  async get(id: string): Promise<SharePayload | null> {
    const stored = this.store.get(id);
    if (!stored) return null;
    if (Date.now() > stored.expiresAt) {
      this.store.delete(id);
      return null;
    }
    return stored.payload;
  }
}

export class SupabaseShareRepository implements ShareRepository {
  private fallback = new InMemoryShareRepository();
  private configured = Boolean(
    (process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL) &&
      process.env.SUPABASE_SERVICE_ROLE_KEY,
  );

  async create(payload: Omit<SharePayload, 'id' | 'createdAt'>): Promise<SharePayload> {
    if (!this.configured) return this.fallback.create(payload);

    const record: SharePayload = {
      ...payload,
      id: generateId(10),
      createdAt: new Date().toISOString(),
    };

    try {
      const admin = createAdminClient();
      const { error } = await admin.from('shares').insert({
        id: record.id,
        payload: record,
        expires_at: new Date(Date.now() + SHARE_TTL_MS).toISOString(),
      });
      if (error) throw error;
      return record;
    } catch (error) {
      console.warn(
        '[share] persist failed, using in-memory fallback:',
        error instanceof Error ? error.message : error,
      );
      return this.fallback.create(payload);
    }
  }

  async get(id: string): Promise<SharePayload | null> {
    if (!this.configured) return this.fallback.get(id);

    try {
      const admin = createAdminClient();
      const now = new Date().toISOString();
      const { data, error } = await admin
        .from('shares')
        .select('payload')
        .eq('id', id)
        .or(`expires_at.is.null,expires_at.gt.${now}`)
        .maybeSingle();
      if (error) throw error;
      if (data) return (data as { payload: SharePayload }).payload;
    } catch (error) {
      console.warn(
        '[share] read failed, using in-memory fallback:',
        error instanceof Error ? error.message : error,
      );
    }
    return this.fallback.get(id);
  }
}

let instance: ShareRepository | null = null;

export function getShareRepository(): ShareRepository {
  if (!instance) {
    instance = new SupabaseShareRepository();
  }
  return instance;
}
