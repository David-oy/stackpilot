'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Eraser,
  Pencil,
  RefreshCw,
  Scale,
  Sparkles,
  Check,
  Save,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { useStack } from '@/lib/stack-context';
import { useAnalysisContext } from '@/lib/analysis-context';
import { useAuth } from '@/lib/auth/auth-context';
import { SavedStacks } from './saved-stacks';
import { StackEditor } from './stack-editor';
import { StackHealth } from './stack-health';
import { ExportMenu } from './export-menu';
import { ShareModal } from './share-modal';
import { ComparisonModal } from './comparison-modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { WorkspaceShell, WorkspaceNavBar } from './workspace-shell';

function LoadingLayout() {
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_300px_300px]">
      <div className="space-y-4">
        <Skeleton className="h-20 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    </div>
  );
}

function EmptyState() {
  const { createStack } = useStack();
  const { analysis, query } = useAnalysisContext();
  const hasAnalysis = !!analysis;

  return (
    <div className="flex flex-col items-center justify-center rounded-2xl glass py-24 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-blue-500 shadow-lg">
        <Sparkles className="h-7 w-7 text-white" />
      </div>
      <h2 className="mt-5 text-xl font-semibold text-foreground">Welcome to your Workspace</h2>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
        Build, compare, and share your perfect tech stack. Everything you pick is saved
        automatically on this device — no account needed.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Button
          onClick={() => {
            const stack = createStack();
            if (stack) toast.success(`Created "${stack.name}"`);
          }}
          className="h-10 gap-2 bg-gradient-to-r from-violet-500 to-blue-500 text-sm text-white hover:from-violet-600 hover:to-blue-600"
        >
          <Sparkles className="h-4 w-4" /> Create New Stack
        </Button>
        {hasAnalysis && (
          <Link
            href={`/search?q=${encodeURIComponent(query ?? '')}`}
            className="inline-flex h-10 items-center gap-2 rounded-md border border-foreground/5 bg-foreground/[0.02] px-4 text-sm text-muted-foreground transition-all hover:border-violet-500/20 hover:text-foreground"
          >
            <RefreshCw className="h-4 w-4" /> Continue from analysis
          </Link>
        )}
      </div>
    </div>
  );
}

function WorkspaceContent() {
  const {
    activeStack,
    hydrated,
    renameStack,
    resetStack,
    clearStack,
    cloudSynced,
    saveStatus,
    saveStack,
  } = useStack();
  const { user } = useAuth();
  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [compareOpen, setCompareOpen] = useState(false);

  if (!hydrated) return <LoadingLayout />;

  if (!activeStack) {
    return (
      <div className="space-y-6">
        <WorkspaceNavBar />
        <EmptyState />
      </div>
    );
  }

  const stack = activeStack;
  const providerCount = stack.categories.reduce((sum, c) => sum + c.providers.length, 0);

  return (
    <div className="space-y-6">
      <WorkspaceNavBar />
      <motion.header
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rounded-2xl glass p-6"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <nav aria-label="Breadcrumb">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" /> Back to home
              </Link>
            </nav>

            <div className="mt-3 flex items-center gap-2">
              {editingName ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (draftName.trim()) renameStack(stack.id, draftName);
                    setEditingName(false);
                  }}
                  className="flex items-center gap-2"
                >
                  <Input
                    autoFocus
                    value={draftName}
                    onChange={(e) => setDraftName(e.target.value)}
                    onBlur={() => setEditingName(false)}
                    className="h-9 w-72 text-lg font-semibold"
                  />
                  <Button type="submit" size="sm" className="h-9 gap-1.5 text-xs">
                    <Check className="h-3.5 w-3.5" /> Save
                  </Button>
                </form>
              ) : (
                <>
                  <h1 className="truncate text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                    {stack.name}
                  </h1>
                  <button
                    onClick={() => {
                      setEditingName(true);
                      setDraftName(stack.name);
                    }}
                    aria-label="Rename stack"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-foreground/5 text-muted-foreground transition-colors hover:border-violet-500/20 hover:text-foreground"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                </>
              )}
            </div>

            {stack.prompt && (
              <p className="mt-1.5 max-w-2xl truncate text-sm text-muted-foreground">{stack.prompt}</p>
            )}
            <p className="mt-2 text-xs text-muted-foreground">
              {stack.categories.length} categories · {providerCount} providers
              {stack.sourceAnalysis && ` · ${stack.sourceAnalysis.complexity} complexity`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {user && (
              saveStatus === 'saved' ? (
                <Button
                  variant="outline"
                  size="sm"
                  disabled
                  className="h-9 gap-1.5 border-emerald-500/20 bg-emerald-500/[0.06] text-xs text-emerald-300"
                >
                  <Check className="h-3.5 w-3.5" /> Saved ✓
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    void saveStack().then((ok) => {
                      if (ok) toast.success('Stack saved to your account');
                      else toast.error('Could not save stack — check your connection');
                    });
                  }}
                  disabled={saveStatus === 'saving'}
                  className="h-9 gap-1.5 text-xs"
                >
                  {saveStatus === 'saving' ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Save className="h-3.5 w-3.5" />
                  )}
                  {saveStatus === 'saving' ? 'Saving...' : 'Save Stack'}
                </Button>
              )
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCompareOpen(true)}
              disabled={providerCount < 2}
              className="h-9 gap-1.5 text-xs"
            >
              <Scale className="h-3.5 w-3.5" /> Compare
            </Button>
            <ExportMenu onShare={setShareUrl} />
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                resetStack();
                toast.success('Stack reset to analysis recommendations');
              }}
              disabled={!stack.sourceAnalysis}
              className="h-9 gap-1.5 text-xs"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Reset
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                clearStack();
                toast.success('Stack cleared');
              }}
              disabled={providerCount === 0}
              className="h-9 gap-1.5 text-xs text-muted-foreground hover:text-rose-300"
            >
              <Eraser className="h-3.5 w-3.5" /> Clear
            </Button>
          </div>
        </div>
      </motion.header>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0">
          <StackEditor />
        </div>
        <div className="space-y-8">
          <StackHealth />
          <div className="rounded-2xl glass p-5">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-500/20 ring-1 ring-emerald-500/20">
                {saveStatus === 'saving' ? (
                  <Loader2 className="h-4 w-4 animate-spin text-emerald-300" />
                ) : saveStatus === 'saved' ? (
                  <Check className="h-4 w-4 text-emerald-300" />
                ) : (
                  <RefreshCw className="h-4 w-4 text-emerald-300" />
                )}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  {!user
                    ? 'Auto-saved'
                    : saveStatus === 'saving'
                      ? 'Saving...'
                      : saveStatus === 'saved'
                        ? 'Saved ✓'
                        : cloudSynced
                          ? 'Synced to cloud'
                          : 'Syncing...'}
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  {!user
                    ? 'Changes are stored locally on this device'
                    : saveStatus === 'saving'
                      ? 'Writing your latest changes'
                      : saveStatus === 'saved'
                        ? 'Changes are saved to your Stack2Set account'
                        : cloudSynced
                          ? 'Changes save automatically'
                          : 'Syncing your stacks...'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <SavedStacks />

      <ShareModal
        open={shareUrl !== null}
        onOpenChange={(open) => {
          if (!open) setShareUrl(null);
        }}
        url={shareUrl ?? ''}
        title={stack.name}
        prompt={stack.prompt}
      />
      <ComparisonModal open={compareOpen} onOpenChange={setCompareOpen} />
    </div>
  );
}

export function WorkspaceView() {
  return (
    <WorkspaceShell>
      <WorkspaceContent />
    </WorkspaceShell>
  );
}
