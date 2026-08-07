'use client';

/**
 * Persists a visitor's search query across the sign-in step so it can be
 * resumed automatically after authentication — without forcing the user to
 * type the same search twice.
 *
 * localStorage is used (rather than sessionStorage) so the query survives an
 * OAuth provider round-trip and email confirmation flows that may open a new tab.
 */

const STORAGE_KEY = 'stack2set:pending-query';
const PENDING_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * Name of the cookie that carries the post-auth destination through the OAuth /
 * email-confirmation round trip. Kept OUT of the callback URL query string so
 * the callback URL stays a bare, allowlist-friendly path (Supabase matches the
 * full redirect URL against the dashboard allowlist, query params included).
 */
export const AUTH_NEXT_COOKIE = 'stack2set:auth-next';

type StoredPendingQuery = {
  query: string;
  savedAt: number;
};

export function savePendingQuery(query: string): void {
  const clean = query.trim();
  if (!clean) return;
  try {
    const payload: StoredPendingQuery = { query: clean, savedAt: Date.now() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Storage unavailable (privacy mode / quota) — search still works, it just
    // won't be auto-resumed after auth.
  }
}

export function getPendingQuery(): string | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredPendingQuery>;
    if (!parsed || typeof parsed.query !== 'string' || !parsed.query.trim()) {
      clearPendingQuery();
      return null;
    }
    if (typeof parsed.savedAt === 'number' && Date.now() - parsed.savedAt > PENDING_TTL_MS) {
      clearPendingQuery();
      return null;
    }
    return parsed.query;
  } catch {
    return null;
  }
}

export function clearPendingQuery(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

/**
 * Persists the destination the auth callback should redirect to (e.g.
 * /search?q=...). Written right before starting an OAuth flow or a sign-up so
 * it survives the provider round-trip and email confirmation, then read and
 * cleared server-side by /auth/callback.
 */
export function setAuthNextCookie(path: string): void {
  try {
    document.cookie = `${AUTH_NEXT_COOKIE}=${encodeURIComponent(path)}; path=/; max-age=${
      PENDING_TTL_MS / 1000
    }; SameSite=Lax`;
  } catch {
    // ignore
  }
}

/**
 * Resolves where to send a user right after authentication. A pending,
 * unconsumed search always wins so users continue exactly where they left off.
 */
export function getPostAuthTarget(fallback: string): { path: string; hasPending: boolean } {
  const pending = getPendingQuery();
  if (pending) {
    return { path: `/search?q=${encodeURIComponent(pending)}`, hasPending: true };
  }
  const safe = fallback.startsWith('/') && !fallback.startsWith('//') ? fallback : '/workspace';
  return { path: safe, hasPending: false };
}
