'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useAnalysisContext } from './analysis-context';
import { useAuth } from '@/lib/auth/auth-context';
import { MergeStacksDialog } from '@/components/auth/merge-stacks-dialog';
import type { StackAnalysis } from './types';
import { LocalStorageStackRepository, type StackRepository } from './stacks/repository';
import {
  deleteCloudStack,
  listCloudStacks,
  localOnlyStacks,
  mergeStacks,
  pushStacksToCloud,
  upsertCloudStack,
} from './stacks/cloud';
import type {
  StackCategory,
  StackProviderInput,
  StackProviderItem,
  UserStack,
} from './stacks/types';
import { computeStackHealth } from './stacks/health';
import { generateId } from './stacks/id';

type StackContextValue = {
  stacks: UserStack[];
  activeStack: UserStack | null;
  activeStackId: string | null;
  hydrated: boolean;
  cloudSynced: boolean;
  /** Auto-save feedback: idle | saving | saved. */
  saveStatus: 'idle' | 'saving' | 'saved';
  /** Persist the current stack to Supabase immediately (Save Stack button). */
  saveStack: () => Promise<boolean>;
  addProvider: (
    categoryId: string,
    categoryName: string,
    provider: StackProviderInput,
    prompt?: string,
  ) => void;
  removeProvider: (categoryId: string, providerId: string) => void;
  moveProvider: (categoryId: string, providerId: string, direction: -1 | 1) => void;
  replaceProvider: (
    categoryId: string,
    providerId: string,
    provider: StackProviderInput,
  ) => void;
  toggleCategory: (categoryId: string) => void;
  clearCategory: (categoryId: string) => void;
  clearStack: () => void;
  resetStack: () => void;
  createStack: (name?: string) => UserStack | null;
  createStackFromAnalysis: (prompt: string, analysis: StackAnalysis) => UserStack | null;
  renameStack: (id: string, name: string) => void;
  duplicateStack: (id: string) => UserStack | null;
  deleteStack: (id: string) => void;
  setActiveStackId: (id: string) => void;
  importStack: (stack: UserStack) => UserStack | null;
  completedCount: number;
  totalCount: number;
};

const StackContext = createContext<StackContextValue | null>(null);

const now = () => new Date().toISOString();

function toProviderItem(provider: StackProviderInput): StackProviderItem {
  return { ...provider, addedAt: now() };
}

function blankStack(name: string, prompt: string, analysis: StackAnalysis | null): UserStack {
  return {
    id: generateId(),
    name: name || 'My Stack',
    prompt,
    createdAt: now(),
    updatedAt: now(),
    sourceAnalysis: analysis,
    categories: [],
  };
}

function stackFromAnalysis(prompt: string, analysis: StackAnalysis): UserStack {
  const toCategory = (cat: StackAnalysis['categories'][number]): StackCategory => ({
    categoryId: cat.id,
    categoryName: cat.name,
    collapsed: false,
    providers: cat.providers.slice(0, 2).map((p) => toProviderItem({
      providerId: p.id,
      name: p.name,
      description: p.description,
      reason: p.reason,
      website: p.website,
      documentation: p.documentation,
      pricingModel: p.pricingModel,
      popularityScore: p.popularityScore,
      freeTier: p.freeTier,
      openSource: p.openSource,
      tags: p.tags,
      features: p.bestUseCases,
    })),
  });
  const categories: StackCategory[] = [
    ...analysis.categories.map(toCategory),
    ...(analysis.integrations ?? []).map((cat) => ({
      ...toCategory(cat),
      categoryId: `integration-${cat.id}`,
    })),
  ];
  return {
    id: generateId(),
    name: `Stack for "${prompt}"`.slice(0, 60),
    prompt,
    createdAt: now(),
    updatedAt: now(),
    sourceAnalysis: analysis,
    categories,
  };
}

export function StackProvider({
  children,
  repository,
}: {
  children: ReactNode;
  repository?: StackRepository;
}) {
  const { analysis, query } = useAnalysisContext();
  const { user } = useAuth();
  const repoRef = useRef<StackRepository | null>(null);
  if (!repoRef.current) {
    repoRef.current = repository ?? new LocalStorageStackRepository();
  }
  const repo = repoRef.current;

  const [stacks, setStacks] = useState<UserStack[]>([]);
  const [activeStack, setActiveStack] = useState<UserStack | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [cloudSynced, setCloudSynced] = useState(false);
  const [mergeOpen, setMergeOpen] = useState(false);
  const [mergeCount, setMergeCount] = useState(0);
  const cloudUserRef = useRef<string | null>(null);

  useEffect(() => {
    try {
      const all = repo.list();
      setStacks(all);
      const activeId = repo.getActiveId();
      const active = activeId ? all.find((s) => s.id === activeId) ?? null : null;
      setActiveStack(active ?? all[0] ?? null);
    } catch {
      // ignore
    }
    setHydrated(true);
  }, [repo]);

  useEffect(() => {
    if (!hydrated) return;
    if (activeStack) {
      repo.save(activeStack);
      repo.setActiveId(activeStack.id);
    } else {
      repo.setActiveId(null);
    }
    setStacks(repo.list());
  }, [activeStack, hydrated, repo]);

  useEffect(() => {
    if (!user) {
      cloudUserRef.current = null;
      setCloudSynced(false);
      setMergeOpen(false);
      return;
    }
    if (cloudUserRef.current === user.id) return;
    cloudUserRef.current = user.id;
    setCloudSynced(false);
    setMergeOpen(false);

    let cancelled = false;
    void (async () => {
      try {
        const cloud = await listCloudStacks(user.id);
        if (cancelled) return;
        const local = repo.list();
        const merged = mergeStacks(local, cloud);
        for (const stack of merged) repo.save(stack);
        setStacks(merged);
        setActiveStack((prev) => {
          if (prev && merged.some((s) => s.id === prev.id)) return prev;
          const activeId = repo.getActiveId();
          return merged.find((s) => s.id === activeId) ?? merged[0] ?? null;
        });
        const localOnly = localOnlyStacks(local, cloud);
        if (localOnly.length > 0) {
          setMergeCount(localOnly.length);
          setMergeOpen(true);
        }
      } catch {
        // Cloud unavailable — stay in local mode.
      } finally {
        if (!cancelled) setCloudSynced(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, repo]);

  useEffect(() => {
    if (!user || !cloudSynced || !hydrated || !activeStack) return;
    const handle = setTimeout(() => {
      void upsertCloudStack(user.id, activeStack).catch(() => {
        // ignore sync failures
      });
    }, 800);
    return () => clearTimeout(handle);
  }, [user, cloudSynced, hydrated, activeStack]);

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const userRef = useRef(user);
  const activeStackRef = useRef<UserStack | null>(activeStack);
  const lastSavedFingerprintRef = useRef<string | null>(null);
  useEffect(() => {
    userRef.current = user;
  }, [user]);
  useEffect(() => {
    activeStackRef.current = activeStack;
  }, [activeStack]);

  /**
   * Content fingerprint used to skip redundant writes. Does not include
   * updatedAt so toggling unrelated things doesn't trigger spurious saves.
   */
  const stackFingerprint = useCallback((stack: UserStack) => {
    return JSON.stringify({
      name: stack.name,
      prompt: stack.prompt,
      sourceAnalysis: stack.sourceAnalysis,
      categories: stack.categories,
      createdAt: stack.createdAt,
    });
  }, []);

  const saveStackNow = useCallback(async (): Promise<boolean> => {
    const currentUser = userRef.current;
    const current = activeStackRef.current;
    if (!currentUser || !current) return false;
    const fingerprint = stackFingerprint(current);
    if (fingerprint === lastSavedFingerprintRef.current) {
      setSaveStatus('saved');
      return true;
    }
    setSaveStatus('saving');
    try {
      const stackWithHealth = current.health
        ? current
        : { ...current, health: computeStackHealth(current) };
      await upsertCloudStack(currentUser.id, stackWithHealth);
      const latest = activeStackRef.current;
      if (latest && stackFingerprint(latest) === fingerprint) {
        lastSavedFingerprintRef.current = fingerprint;
        setSaveStatus('saved');
      } else {
        setSaveStatus('idle');
      }
      return true;
    } catch {
      setSaveStatus('idle');
      return false;
    }
  }, [stackFingerprint]);

  /**
   * Manual save only: the stack persists to the account when the user clicks
   * "Save Stack". Any change to the active stack flips the status back to idle
   * so the Save button reappears. (Local on-device persistence still happens
   * automatically via the repository.)
   */
  useEffect(() => {
    if (!hydrated || !activeStack) return;
    if (stackFingerprint(activeStack) !== lastSavedFingerprintRef.current) {
      setSaveStatus('idle');
    }
  }, [hydrated, activeStack, stackFingerprint]);

  const handleMerge = useCallback(() => {
    setMergeOpen(false);
    if (!user) return;
    const local = repo.list();
    void pushStacksToCloud(user.id, local).catch(() => {
      // ignore sync failures
    });
  }, [repo, user]);

  const updateActive = useCallback((updater: (stack: UserStack) => UserStack) => {
    setActiveStack((prev) => {
      if (!prev) return prev;
      const next = updater(prev);
      return { ...next, updatedAt: now() };
    });
  }, []);

  const activate = useCallback(
    (stack: UserStack | null) => {
      setActiveStack(stack);
      if (stack) repo.setActiveId(stack.id);
      else repo.setActiveId(null);
    },
    [repo],
  );

  const addProvider = useCallback(
    (categoryId: string, categoryName: string, provider: StackProviderInput, prompt?: string) => {
      const item = toProviderItem(provider);
      setActiveStack((prev) => {
        const base =
          prev ??
          blankStack(prompt ? `Stack for "${prompt}"` : 'My Stack', prompt ?? '', analysis);
        const existing = base.categories.find((c) => c.categoryId === categoryId);
        let categories: StackCategory[];
        if (existing) {
          categories = base.categories.map((c) =>
            c.categoryId === categoryId
              ? {
                  ...c,
                  collapsed: false,
                  providers: c.providers.some((p) => p.providerId === item.providerId)
                    ? c.providers
                    : [...c.providers, item],
                }
              : c,
          );
        } else {
          categories = [
            ...base.categories,
            { categoryId, categoryName, collapsed: false, providers: [item] },
          ];
        }
        return { ...base, categories, updatedAt: now() };
      });
    },
    [analysis],
  );

  const removeProvider = useCallback((categoryId: string, providerId: string) => {
    updateActive((stack) => ({
      ...stack,
      categories: stack.categories.map((c) =>
        c.categoryId === categoryId
          ? { ...c, providers: c.providers.filter((p) => p.providerId !== providerId) }
          : c,
      ),
    }));
  }, [updateActive]);

  const moveProvider = useCallback(
    (categoryId: string, providerId: string, direction: -1 | 1) => {
      updateActive((stack) => ({
        ...stack,
        categories: stack.categories.map((c) => {
          if (c.categoryId !== categoryId) return c;
          const index = c.providers.findIndex((p) => p.providerId === providerId);
          const target = index + direction;
          if (index < 0 || target < 0 || target >= c.providers.length) return c;
          const next = [...c.providers];
          [next[index], next[target]] = [next[target], next[index]];
          return { ...c, providers: next };
        }),
      }));
    },
    [updateActive],
  );

  const replaceProvider = useCallback(
    (categoryId: string, providerId: string, provider: StackProviderInput) => {
      const item = toProviderItem(provider);
      updateActive((stack) => ({
        ...stack,
        categories: stack.categories.map((c) =>
          c.categoryId === categoryId
            ? {
                ...c,
                providers: c.providers.map((p) =>
                  p.providerId === providerId ? { ...item, addedAt: p.addedAt } : p,
                ),
              }
            : c,
        ),
      }));
    },
    [updateActive],
  );

  const toggleCategory = useCallback(
    (categoryId: string) => {
      updateActive((stack) => ({
        ...stack,
        categories: stack.categories.map((c) =>
          c.categoryId === categoryId ? { ...c, collapsed: !c.collapsed } : c,
        ),
      }));
    },
    [updateActive],
  );

  const clearCategory = useCallback(
    (categoryId: string) => {
      updateActive((stack) => ({
        ...stack,
        categories: stack.categories.map((c) =>
          c.categoryId === categoryId ? { ...c, providers: [] } : c,
        ),
      }));
    },
    [updateActive],
  );

  const clearStack = useCallback(() => {
    updateActive((stack) => ({
      ...stack,
      categories: stack.categories.map((c) => ({ ...c, providers: [] })),
    }));
  }, [updateActive]);

  const resetStack = useCallback(() => {
    setActiveStack((prev) => {
      if (!prev || !analysis) return prev;
      const next = stackFromAnalysis(query ?? prev.prompt, analysis);
      next.id = prev.id;
      next.createdAt = prev.createdAt;
      next.name = prev.name;
      next.updatedAt = now();
      return next;
    });
  }, [analysis, query]);

  const createStack = useCallback(
    (name?: string) => {
      const stack = blankStack(name ?? 'My Stack', query ?? '', analysis);
      setStacks((prev) => [stack, ...prev]);
      activate(stack);
      return stack;
    },
    [activate, analysis, query],
  );

  const createStackFromAnalysis = useCallback(
    (prompt: string, data: StackAnalysis) => {
      const existing = stacks.find(
        (s) => s.prompt === prompt && s.sourceAnalysis?.projectType === data.projectType,
      );
      if (existing) {
        activate(existing);
        return existing;
      }
      const stack = stackFromAnalysis(prompt, data);
      setStacks((prev) => [stack, ...prev]);
      activate(stack);
      return stack;
    },
    [activate, stacks],
  );

  const renameStack = useCallback(
    (id: string, name: string) => {
      const clean = name.trim();
      if (!clean) return;
      if (activeStack && activeStack.id === id) {
        updateActive((stack) => ({ ...stack, name: clean }));
      } else {
        setStacks((prev) =>
          prev.map((s) => (s.id === id ? { ...s, name: clean, updatedAt: now() } : s)),
        );
        const source = stacks.find((s) => s.id === id);
        if (user && source) {
          void upsertCloudStack(user.id, { ...source, name: clean, updatedAt: now() }).catch(
            () => {
              // ignore sync failures
            },
          );
        }
      }
    },
    [activeStack, stacks, updateActive, user],
  );

  const duplicateStack = useCallback(
    (id: string) => {
      const source = stacks.find((s) => s.id === id) ?? activeStack;
      if (!source) return null;
      const copy: UserStack = {
        ...source,
        id: generateId(),
        name: `${source.name} (copy)`,
        createdAt: now(),
        updatedAt: now(),
        categories: source.categories.map((c) => ({
          ...c,
          collapsed: false,
          providers: c.providers.map((p) => ({ ...p })),
        })),
      };
      setStacks((prev) => [copy, ...prev]);
      activate(copy);
      return copy;
    },
    [activate, activeStack, stacks],
  );

  const deleteStack = useCallback(
    (id: string) => {
      repo.delete(id);
      setStacks((prev) => prev.filter((s) => s.id !== id));
      setActiveStack((prev) => {
        if (!prev || prev.id !== id) return prev;
        const remaining = repo.list();
        return remaining[0] ?? null;
      });
      if (user) {
        void deleteCloudStack(user.id, id).catch(() => {
          // ignore sync failures
        });
      }
    },
    [repo, user],
  );

  const setActiveStackId = useCallback(
    (id: string) => {
      const stack = stacks.find((s) => s.id === id) ?? null;
      setActiveStack(stack);
      if (stack) repo.setActiveId(stack.id);
    },
    [repo, stacks],
  );

  const importStack = useCallback(
    (stack: UserStack) => {
      const imported: UserStack = {
        ...stack,
        id: stack.id || generateId(),
        name: stack.name?.trim() || 'Imported Stack',
        prompt: stack.prompt ?? '',
        createdAt: stack.createdAt || now(),
        updatedAt: now(),
        sourceAnalysis: stack.sourceAnalysis ?? null,
        categories: Array.isArray(stack.categories) ? stack.categories : [],
      };
      repo.save(imported);
      setStacks(repo.list());
      activate(imported);
      return imported;
    },
    [activate, repo],
  );

  const { completedCount, totalCount } = useMemo(() => {
    if (!activeStack) return { completedCount: 0, totalCount: 0 };
    const recommended = [
      ...(analysis?.categories ?? activeStack.categories),
      ...(analysis?.integrations ?? []).map((cat) => ({
        ...cat,
        id: `integration-${cat.id}`,
      })),
    ];
    const total = recommended.length;
    const completed = recommended.filter((cat) => {
      const categoryId = 'categoryId' in cat ? cat.categoryId : cat.id;
      const entry = activeStack.categories.find((c) => c.categoryId === categoryId);
      return entry && entry.providers.length > 0;
    }).length;
    return { completedCount: completed, totalCount: total };
  }, [activeStack, analysis]);

  const value: StackContextValue = {
    stacks,
    activeStack,
    activeStackId: activeStack?.id ?? null,
    hydrated,
    cloudSynced,
    saveStatus,
    saveStack: saveStackNow,
    addProvider,
    removeProvider,
    moveProvider,
    replaceProvider,
    toggleCategory,
    clearCategory,
    clearStack,
    resetStack,
    createStack,
    createStackFromAnalysis,
    renameStack,
    duplicateStack,
    deleteStack,
    setActiveStackId,
    importStack,
    completedCount,
    totalCount,
  };

  return (
    <StackContext.Provider value={value}>
      {children}
      <MergeStacksDialog
        open={mergeOpen}
        onOpenChange={setMergeOpen}
        onMerge={handleMerge}
        count={mergeCount}
        email={user?.email ?? ''}
      />
    </StackContext.Provider>
  );
}

export function useStack() {
  const ctx = useContext(StackContext);
  if (!ctx) throw new Error('useStack must be used within StackProvider');
  return ctx;
}
