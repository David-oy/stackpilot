'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { useWorkspaces } from '@/lib/workspaces/context';
import { LOCAL_WORKSPACE_ID } from '@/lib/workspaces/types';

export type Favorite = {
  slug: string;
  categoryId: string | null;
  createdAt: string;
};

type FavoritesContextValue = {
  favorites: Favorite[];
  hydrated: boolean;
  isFavorite: (slug: string) => boolean;
  toggleFavorite: (slug: string, categoryId?: string) => Promise<void>;
};

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

function localKey(workspaceId: string): string {
  return `stack2set:favorites:${workspaceId}`;
}

function readLocal(key: string): Favorite[] {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((f) => f && typeof f.slug === 'string')
      : [];
  } catch {
    return [];
  }
}

function writeLocal(key: string, favorites: Favorite[]): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(favorites));
  } catch {
    // ignore storage errors
  }
}

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspaces();
  const workspaceId = user ? (currentWorkspace?.id ?? null) : LOCAL_WORKSPACE_ID;
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const loadKeyRef = useRef<string | null>(null);

  // Signed-in favorites live in the account (cloud) scoped per workspace;
  // signed-out favorites are stored per-workspace on the device so each
  // workspace keeps its own list. Until a signed-in user's cloud workspace
  // resolves, `workspaceId` is null — we keep the on-device list and never
  // send the local id to the API (its workspace_id column is a Postgres uuid).
  useEffect(() => {
    const key = user ? `cloud:${user.id}:${workspaceId ?? 'pending'}` : `local:${workspaceId}`;
    if (loadKeyRef.current === key) return;
    loadKeyRef.current = key;
    setFavorites([]);
    setHydrated(false);
    let cancelled = false;

    if (user && workspaceId) {
      void (async () => {
        try {
          const res = await fetch(
            `/api/favorites?workspaceId=${encodeURIComponent(workspaceId)}`,
          );
          const data = (await res.json()) as {
            favorites?: Array<{
              providerSlug: string;
              categoryId: string | null;
              createdAt: string;
            }>;
          };
          if (!cancelled) {
            setFavorites(
              (data.favorites ?? []).map((f) => ({
                slug: f.providerSlug,
                categoryId: f.categoryId ?? null,
                createdAt: f.createdAt,
              })),
            );
          }
        } catch {
          // API unavailable — start empty.
        } finally {
          if (!cancelled) setHydrated(true);
        }
      })();
    } else {
      const stored = readLocal(localKey(workspaceId ?? LOCAL_WORKSPACE_ID));
      if (!cancelled) {
        setFavorites(stored);
        setHydrated(true);
      }
    }

    return () => {
      cancelled = true;
    };
  }, [user, workspaceId]);

  const isFavorite = useCallback(
    (slug: string) => favorites.some((f) => f.slug === slug),
    [favorites],
  );

  const toggleFavorite = useCallback(
    async (slug: string, categoryId?: string) => {
      const wasFavorite = favorites.some((f) => f.slug === slug);
      const optimistic: Favorite = {
        slug,
        categoryId: categoryId ?? null,
        createdAt: new Date().toISOString(),
      };

      setFavorites((prev) =>
        wasFavorite ? prev.filter((f) => f.slug !== slug) : [optimistic, ...prev],
      );

      if (user && workspaceId) {
        try {
          const res = wasFavorite
            ? await fetch(
                `/api/favorites?slug=${encodeURIComponent(slug)}&workspaceId=${encodeURIComponent(workspaceId)}`,
                {
                  method: 'DELETE',
                },
              )
            : await fetch('/api/favorites', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  slug,
                  categoryId: categoryId ?? null,
                  workspaceId,
                }),
              });
          if (!res.ok) throw new Error('Favorite request failed.');
        } catch (error) {
          setFavorites((prev) =>
            wasFavorite ? [...prev, optimistic] : prev.filter((f) => f.slug !== slug),
          );
          throw error;
        }
      } else {
        setFavorites((prev) => {
          const next = wasFavorite
            ? prev.filter((f) => f.slug !== slug)
            : [optimistic, ...prev];
          writeLocal(localKey(workspaceId ?? LOCAL_WORKSPACE_ID), next);
          return next;
        });
      }
    },
    [favorites, user, workspaceId],
  );

  const value = useMemo<FavoritesContextValue>(
    () => ({ favorites, hydrated, isFavorite, toggleFavorite }),
    [favorites, hydrated, isFavorite, toggleFavorite],
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites must be used within FavoritesProvider');
  return ctx;
}
