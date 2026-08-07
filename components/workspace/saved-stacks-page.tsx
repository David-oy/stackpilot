'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Bookmark, FileUp, FolderOpen, Layers, Plus, Play, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { useStack } from '@/lib/stack-context';
import { useAuth } from '@/lib/auth/auth-context';
import { useWorkspaces } from '@/lib/workspaces/context';
import {
  computeStackHealth,
  formatCurrency,
  stackCategoryCount,
  stackProviderCount,
} from '@/lib/stacks/health';
import type { UserStack } from '@/lib/stacks/types';
import { importStackFromPdf } from '@/lib/stacks/import-pdf';
import { parseStackImport } from '@/lib/stacks/export';
import { StackCard } from './stack-card';
import { Button } from '@/components/ui/button';

export function SavedStacksPage() {
  const router = useRouter();
  const { stacks, createStack, importStack } = useStack();
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspaces();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportFile = async (file: File) => {
    try {
      const stack: UserStack | null =
        file.name.toLowerCase().endsWith('.pdf')
          ? await importStackFromPdf(file)
          : parseStackImport(await file.text());
      if (!stack) throw new Error('Could not read that file as a Stack2Set stack.');
      importStack(stack);
      toast.success(`Imported "${stack.name}"`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not import that file.');
    }
  };

  const openStack = (id: string) => {
    router.push('/workspace');
  };

  const totalProviders = stacks.reduce((sum, s) => sum + stackProviderCount(s), 0);
  const totalCategories = stacks.reduce((sum, s) => sum + stackCategoryCount(s), 0);
  const totalMonthlyCost = stacks.reduce(
    (sum, s) =>
      sum +
      (typeof s.health?.estimatedMonthlyCost === 'number'
        ? s.health.estimatedMonthlyCost
        : computeStackHealth(s).estimatedMonthlyCost),
    0,
  );

  return (
    <div className="space-y-6">
      <motion.header
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rounded-2xl glass p-6 sm:p-8"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-blue-500 shadow-lg shadow-violet-500/20">
              <Bookmark className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                Saved Stacks
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {user ? 'Stored in your Stack2Set account' : 'Saved on this device'} ·{' '}
                {currentWorkspace?.name ?? 'My Workspace'}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-1.5 text-xs"
              onClick={() => fileInputRef.current?.click()}
            >
              <FileUp className="h-3.5 w-3.5" /> Import
            </Button>
            <Button
              size="sm"
              className="h-9 gap-1.5 bg-gradient-to-r from-violet-500 to-blue-500 text-xs text-white hover:from-violet-600 hover:to-blue-600"
              onClick={() => {
                const stack = createStack();
                if (stack) toast.success(`Created "${stack.name}"`);
              }}
            >
              <Plus className="h-3.5 w-3.5" /> New Stack
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json,.md,text/markdown,.txt,.pdf,application/pdf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleImportFile(file);
                e.target.value = '';
              }}
            />
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="flex items-center gap-3 rounded-xl border border-foreground/5 bg-foreground/[0.02] p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/15 ring-1 ring-violet-500/20">
              <FolderOpen className="h-4 w-4 text-violet-300" />
            </div>
            <div>
              <p className="text-xl font-semibold text-foreground">{stacks.length}</p>
              <p className="text-[11px] text-muted-foreground">Saved stacks</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-foreground/5 bg-foreground/[0.02] p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/15 ring-1 ring-blue-500/20">
              <Layers className="h-4 w-4 text-blue-300" />
            </div>
            <div>
              <p className="text-xl font-semibold text-foreground">{totalProviders}</p>
              <p className="text-[11px] text-muted-foreground">
                Providers across {totalCategories} categories
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-foreground/5 bg-foreground/[0.02] p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/15 ring-1 ring-emerald-500/20">
              <Sparkles className="h-4 w-4 text-emerald-300" />
            </div>
            <div>
              <p className="text-xl font-semibold text-foreground">
                {formatCurrency(totalMonthlyCost)}/mo
              </p>
              <p className="text-[11px] text-muted-foreground">Combined est. monthly cost</p>
            </div>
          </div>
        </div>
      </motion.header>

      {stacks.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-foreground/10 py-20 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/10 ring-1 ring-violet-500/20">
            <Bookmark className="h-6 w-6 text-violet-300" />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-foreground">No saved stacks yet</h2>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Analyze a project, build a stack, or import one to see it here.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Button
              className="h-10 gap-1.5 bg-gradient-to-r from-violet-500 to-blue-500 text-sm text-white hover:from-violet-600 hover:to-blue-600"
              onClick={() => {
                const stack = createStack();
                if (stack) router.push('/workspace');
              }}
            >
              <Plus className="h-4 w-4" /> Create a Stack
            </Button>
            <Link
              href="/"
              className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-foreground/5 bg-foreground/[0.02] px-4 text-sm text-muted-foreground transition-colors hover:border-violet-500/20 hover:text-foreground"
            >
              <Play className="h-4 w-4" /> Start a New Build
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {stacks.map((stack, i) => (
            <StackCard key={stack.id} stack={stack} index={i} onOpen={openStack} />
          ))}
        </div>
      )}
    </div>
  );
}
