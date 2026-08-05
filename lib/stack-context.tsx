'use client';

import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { categories } from '@/lib/categories';

type StackEntry = { providerId: string; providerName: string };
type StackMap = Record<string, StackEntry | null>;

type StackContextValue = {
  stack: StackMap;
  addToStack: (categoryId: string, providerId: string, providerName: string) => void;
  removeFromStack: (categoryId: string) => void;
  completedCount: number;
  totalCount: number;
};

const StackContext = createContext<StackContextValue | null>(null);

export function StackProvider({ children }: { children: ReactNode }) {
  const [stack, setStack] = useState<StackMap>({});

  const addToStack = useCallback((categoryId: string, providerId: string, providerName: string) => {
    setStack((prev) => ({ ...prev, [categoryId]: { providerId, providerName } }));
  }, []);

  const removeFromStack = useCallback((categoryId: string) => {
    setStack((prev) => ({ ...prev, [categoryId]: null }));
  }, []);

  const completedCount = categories.filter((c) => stack[c.id]).length;
  const totalCount = categories.length;

  return (
    <StackContext.Provider value={{ stack, addToStack, removeFromStack, completedCount, totalCount }}>
      {children}
    </StackContext.Provider>
  );
}

export function useStack() {
  const ctx = useContext(StackContext);
  if (!ctx) throw new Error('useStack must be used within StackProvider');
  return ctx;
}
