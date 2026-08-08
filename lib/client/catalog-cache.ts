'use client';

import type { CategoryRecord, ProviderWithRelations } from '@/lib/db/schema';

// Device-side performance cache for the public catalog. IndexedDB only — the
// catalog (1,000+ providers) is far too large for cookies, and this store is
// deliberately isolated from any user/private data.
//
// It is NEVER authoritative: every navigation revalidates against hosted
// Supabase and replaces this snapshot with the newest revision.

const DB_NAME = 'stack2set-catalog';
const DB_VERSION = 1;
const STORE = 'snapshots';
const META_KEY = 'catalog';

// Bump when the cached shape or the code that reads it changes; old entries are
// then ignored and refetched instead of being parsed with a stale schema.
export const CATALOG_CACHE_VERSION = 1;

export type CatalogSnapshot = {
  revision: string;
  version: number;
  savedAt: number;
  categories: CategoryRecord[];
  providers: ProviderWithRelations[];
};

function openDb(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    if (typeof indexedDB === 'undefined') {
      resolve(null);
      return;
    }
    let req: IDBOpenDBRequest;
    try {
      req = indexedDB.open(DB_NAME, DB_VERSION);
    } catch {
      resolve(null);
      return;
    }
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(null);
  });
}

function requestResult<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function transactionDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error ?? new Error('IndexedDB transaction aborted'));
  });
}

export async function loadCachedCatalog(): Promise<CatalogSnapshot | null> {
  const db = await openDb();
  if (!db) return null;
  try {
    const tx = db.transaction(STORE, 'readonly');
    const snap = (await requestResult(tx.objectStore(STORE).get(META_KEY))) as
      | CatalogSnapshot
      | undefined;
    // Missing, wrong cache version, or structurally invalid => treat as no cache
    // so the caller always refetches from Supabase.
    if (!snap || snap.version !== CATALOG_CACHE_VERSION) return null;
    if (
      !Array.isArray(snap.categories) ||
      !Array.isArray(snap.providers) ||
      snap.providers.length === 0 ||
      typeof snap.revision !== 'string'
    ) {
      return null;
    }
    return snap;
  } catch {
    return null;
  } finally {
    db.close();
  }
}

export async function persistCatalog(
  snapshot: Omit<CatalogSnapshot, 'savedAt'>,
): Promise<void> {
  const db = await openDb();
  if (!db) return;
  try {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put({ ...snapshot, savedAt: Date.now() }, META_KEY);
    await transactionDone(tx);
  } catch {
    // Best-effort only: quota/serialization failures must never break the app.
    // Drop the cache so the next load refetches instead of serving a partial write.
    try {
      await clearCachedCatalog();
    } catch {
      // ignore
    }
  } finally {
    db.close();
  }
}

export async function clearCachedCatalog(): Promise<void> {
  const db = await openDb();
  if (!db) return;
  try {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(META_KEY);
    await transactionDone(tx);
  } catch {
    // ignore
  } finally {
    db.close();
  }
}
