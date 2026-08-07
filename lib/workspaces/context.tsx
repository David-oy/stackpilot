'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { generateId } from '@/lib/stacks/id';
import {
  createWorkspace as createCloudWorkspace,
  deleteWorkspace as deleteCloudWorkspace,
  listWorkspaces,
  setLastOpened,
  updateWorkspace,
} from './cloud';
import {
  DEFAULT_WORKSPACE_COLOR,
  DEFAULT_WORKSPACE_ICON,
  LOCAL_WORKSPACE_ID,
} from './types';
import type { Workspace, WorkspaceInput } from './types';

const CACHE_KEY = 'stack2set:workspaces';
const LAST_WORKSPACE_KEY = 'stack2set:last-workspace';
const LOCAL_WORKSPACE_META_KEY = 'stack2set:local-workspace';

const now = () => new Date().toISOString();

type WorkspaceContextValue = {
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  hydrated: boolean;
  /** True during a brief window after switching so UI can show a skeleton. */
  switching: boolean;
  switchWorkspace: (id: string) => void;
  createWorkspace: (input: WorkspaceInput) => Promise<Workspace | null>;
  renameWorkspace: (id: string, input: WorkspaceInput) => Promise<void>;
  duplicateWorkspace: (id: string) => Promise<Workspace | null>;
  archiveWorkspace: (id: string) => Promise<void>;
  deleteWorkspace: (id: string) => Promise<void>;
};

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

function readJson<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore quota / privacy mode errors
  }
}

function readLastWorkspaceId(): string | null {
  try {
    return window.localStorage.getItem(LAST_WORKSPACE_KEY);
  } catch {
    return null;
  }
}

function writeLastWorkspaceId(id: string): void {
  try {
    window.localStorage.setItem(LAST_WORKSPACE_KEY, id);
  } catch {
    // ignore
  }
}

function mergeWorkspaces(cloud: Workspace[], cached: Workspace[]): Workspace[] {
  const byId = new Map<string, Workspace>();
  for (const ws of cached) byId.set(ws.id, ws);
  for (const ws of cloud) byId.set(ws.id, ws);
  return [...byId.values()].sort((a, b) => (a.lastOpenedAt < b.lastOpenedAt ? 1 : -1));
}

function localWorkspace(): Workspace {
  const base: Workspace = {
    id: LOCAL_WORKSPACE_ID,
    userId: LOCAL_WORKSPACE_ID,
    name: 'My Workspace',
    description: '',
    icon: DEFAULT_WORKSPACE_ICON,
    color: DEFAULT_WORKSPACE_COLOR,
    createdAt: now(),
    updatedAt: now(),
    lastOpenedAt: now(),
    archivedAt: null,
  };
  const meta = readJson<Partial<Workspace>>(LOCAL_WORKSPACE_META_KEY);
  if (meta && typeof meta.name === 'string') {
    return {
      ...base,
      name: meta.name,
      description: meta.description ?? '',
      icon: meta.icon ?? base.icon,
      color: meta.color ?? base.color,
    };
  }
  return base;
}

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [switching, setSwitching] = useState(false);
  const workspacesRef = useRef<Workspace[]>([]);
  const switchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  workspacesRef.current = workspaces;

  useEffect(() => {
    if (!currentWorkspace) return;
    if (currentWorkspace.id !== LOCAL_WORKSPACE_ID && user) {
      writeJson(CACHE_KEY, workspaces);
    }
  }, [workspaces, currentWorkspace, user]);

  const setSwitchingWithTimeout = useCallback(() => {
    setSwitching(true);
    if (switchTimerRef.current) clearTimeout(switchTimerRef.current);
    switchTimerRef.current = setTimeout(() => setSwitching(false), 350);
  }, []);

  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;

    if (!user) {
      const local = localWorkspace();
      setWorkspaces([local]);
      setCurrentWorkspace(local);
      setHydrated(true);
      return () => {
        cancelled = true;
      };
    }

    // Signed in: paint the cached workspace list immediately, then reconcile
    // with the cloud and create a default workspace if none exists yet.
    setHydrated(false);
    const cached = (readJson<Workspace[]>(CACHE_KEY) ?? []).filter(
      (ws) => ws.userId === user.id && !ws.archivedAt,
    );
    if (cached.length > 0) {
      setWorkspaces(cached);
      const lastId = readLastWorkspaceId();
      const last = cached.find((ws) => ws.id === lastId) ?? cached[0] ?? null;
      setCurrentWorkspace(last);
    } else {
      setWorkspaces([]);
      setCurrentWorkspace(null);
    }
    setHydrated(true);

    void (async () => {
      try {
        let cloud = await listWorkspaces(user.id);
        if (cancelled) return;

        if (cloud.length === 0) {
          const created = await createCloudWorkspace(user.id, {
            name: 'My Workspace',
            icon: DEFAULT_WORKSPACE_ICON,
            color: DEFAULT_WORKSPACE_COLOR,
          });
          if (cancelled) return;
          if (created) {
            cloud = [created];
            writeLastWorkspaceId(created.id);
            setWorkspaces([created]);
            setCurrentWorkspace(created);
          }
          return;
        }

        const merged = mergeWorkspaces(cloud, cached);
        const lastId = readLastWorkspaceId();
        const last = merged.find((ws) => ws.id === lastId) ?? merged[0] ?? null;
        setWorkspaces(merged);
        setCurrentWorkspace(last);
        writeJson(CACHE_KEY, merged);
      } catch {
        // Cloud unavailable — the cached list (if any) already painted.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  const switchWorkspace = useCallback(
    (id: string) => {
      const target = workspacesRef.current.find((ws) => ws.id === id);
      if (!target || target.id === currentWorkspace?.id) return;
      writeLastWorkspaceId(id);
      setWorkspaces((prev) =>
        prev.map((ws) => (ws.id === id ? { ...ws, lastOpenedAt: now() } : ws)),
      );
      setCurrentWorkspace(target);
      setSwitchingWithTimeout();
      if (user) {
        setLastOpened(user.id, id).catch(() => {
          // ignore sync failures
        });
      }
    },
    [currentWorkspace?.id, setSwitchingWithTimeout, user],
  );

  const createWorkspace = useCallback(
    async (input: WorkspaceInput): Promise<Workspace | null> => {
      let ws: Workspace;
      if (user) {
        const cloud = await createCloudWorkspace(user.id, input).catch(() => null);
        ws = cloud ?? {
          id: generateId(),
          userId: user.id,
          name: input.name,
          description: input.description ?? '',
          icon: input.icon,
          color: input.color,
          createdAt: now(),
          updatedAt: now(),
          lastOpenedAt: now(),
          archivedAt: null,
        };
      } else {
        ws = localWorkspace();
        ws = {
          ...ws,
          name: input.name,
          description: input.description ?? '',
          icon: input.icon,
          color: input.color,
          updatedAt: now(),
          lastOpenedAt: now(),
        };
        writeJson(LOCAL_WORKSPACE_META_KEY, {
          name: ws.name,
          description: ws.description,
          icon: ws.icon,
          color: ws.color,
        });
      }
      setWorkspaces((prev) => [ws, ...prev.filter((item) => item.id !== ws.id)]);
      writeLastWorkspaceId(ws.id);
      setCurrentWorkspace(ws);
      setSwitchingWithTimeout();
      return ws;
    },
    [setSwitchingWithTimeout, user],
  );

  const renameWorkspace = useCallback(
    async (id: string, input: WorkspaceInput) => {
      setWorkspaces((prev) =>
        prev.map((ws) =>
          ws.id === id
            ? {
                ...ws,
                name: input.name,
                description: input.description ?? ws.description,
                icon: input.icon,
                color: input.color,
                updatedAt: now(),
              }
            : ws,
        ),
      );
      setCurrentWorkspace((prev) =>
        prev && prev.id === id
          ? {
              ...prev,
              name: input.name,
              description: input.description ?? prev.description,
              icon: input.icon,
              color: input.color,
              updatedAt: now(),
            }
          : prev,
      );
      if (!user) {
        writeJson(LOCAL_WORKSPACE_META_KEY, {
          name: input.name,
          description: input.description ?? '',
          icon: input.icon,
          color: input.color,
        });
      } else {
        updateWorkspace(user.id, id, input).catch(() => {
          // ignore sync failures
        });
      }
    },
    [user],
  );

  const duplicateWorkspace = useCallback(
    async (id: string): Promise<Workspace | null> => {
      const source = workspacesRef.current.find((ws) => ws.id === id);
      if (!source) return null;
      return createWorkspace({
        name: `${source.name} (copy)`,
        description: source.description,
        icon: source.icon,
        color: source.color,
      });
    },
    [createWorkspace],
  );

  const removeWorkspace = useCallback(
    async (id: string, mode: 'archive' | 'delete') => {
      const remaining = workspacesRef.current.filter((ws) => ws.id !== id);
      if (remaining.length === 0) return;
      setWorkspaces(remaining);
      if (currentWorkspace?.id === id) {
        switchWorkspace(remaining[0].id);
      }
      if (user) {
        if (mode === 'archive') {
          updateWorkspace(user.id, id, { archivedAt: now() }).catch(() => {
            // ignore sync failures
          });
        } else {
          deleteCloudWorkspace(user.id, id).catch(() => {
            // ignore sync failures
          });
        }
      }
    },
    [currentWorkspace?.id, switchWorkspace, user],
  );

  const archiveWorkspace = useCallback(
    (id: string) => removeWorkspace(id, 'archive'),
    [removeWorkspace],
  );

  const deleteWorkspace = useCallback(
    (id: string) => removeWorkspace(id, 'delete'),
    [removeWorkspace],
  );

  const value = useMemo<WorkspaceContextValue>(
    () => ({
      workspaces,
      currentWorkspace,
      hydrated,
      switching,
      switchWorkspace,
      createWorkspace,
      renameWorkspace,
      duplicateWorkspace,
      archiveWorkspace,
      deleteWorkspace,
    }),
    [
      workspaces,
      currentWorkspace,
      hydrated,
      switching,
      switchWorkspace,
      createWorkspace,
      renameWorkspace,
      duplicateWorkspace,
      archiveWorkspace,
      deleteWorkspace,
    ],
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspaces() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error('useWorkspaces must be used within WorkspaceProvider');
  return ctx;
}
