'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  CloudUpload,
  Eraser,
  LogIn,
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
import { useWorkspaces } from '@/lib/workspaces/context';
import { AuthModal } from '@/components/auth/auth-modal';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { SavedStacks } from './saved-stacks';
import { FavoritesSection } from './favorites-section';
import { StackEditor } from './stack-editor';
import { StackHealth } from './stack-health';
import { ExportMenu } from './export-menu';
import { ShareModal } from './share-modal';
import { ComparisonModal } from './comparison-modal';
import { StackBreadcrumbs } from './stack-breadcrumbs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { WorkspaceShell } from './workspace-shell';

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
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-500 shadow-lg">
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
          className="h-10 gap-2 bg-teal-500 text-sm text-white hover:bg-teal-600"
        >
          <Sparkles className="h-4 w-4" /> Create New Stack
        </Button>
        {hasAnalysis && (
          <Link
            href={`/search?q=${encodeURIComponent(query ?? '')}`}
            className="inline-flex h-10 items-center gap-2 rounded-md border border-foreground/5 bg-foreground/[0.02] px-4 text-sm text-muted-foreground transition-all hover:border-teal-500/25 hover:text-foreground"
          >
            <RefreshCw className="h-4 w-4" /> Continue from analysis
          </Link>
        )}
      </div>
    </div>
  );
}

function SaveToCloudDialog({
  open,
  onOpenChange,
  stackName,
  categoryCount,
  providerCount,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stackName: string;
  categoryCount: number;
  providerCount: number;
  onSaved?: () => void;
}) {
  const { user } = useAuth();
  const { saveStatus, saveStack } = useStack();
  const [authOpen, setAuthOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const ok = await saveStack();
    setSaving(false);
    if (ok) {
      toast.success('Saved to cloud', {
        description: 'Your stack is synced and available anywhere.',
      });
      onOpenChange(false);
    } else {
      toast.error('Could not save stack — check your connection');
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Save to Cloud</DialogTitle>
            <DialogDescription>
              Keep this stack synced across your devices and browser sessions.
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center gap-3 rounded-xl border border-foreground/5 bg-foreground/[0.02] p-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500/20 to-cyan-500/20 ring-1 ring-teal-500/20">
              <CloudUpload className="h-5 w-5 text-teal-300" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">{stackName}</p>
              <p className="text-[11px] text-muted-foreground">
                {categoryCount} categories · {providerCount} providers
              </p>
            </div>
          </div>

          {!user ? (
            <div className="space-y-3">
              <p className="text-sm leading-relaxed text-muted-foreground">
                Saving to the cloud requires a free Stack2Set account. Your stack stays on this
                device until you sign in.
              </p>
              <Button
                className="h-10 w-full gap-2 bg-teal-500 text-white hover:bg-teal-600"
                onClick={() => setAuthOpen(true)}
              >
                <LogIn className="h-4 w-4" /> Create a free account
              </Button>
            </div>
          ) : saveStatus === 'saved' ? (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/[0.06] p-3">
              <Check className="h-4 w-4 shrink-0 text-emerald-300" />
              <p className="text-sm text-emerald-300">
                This stack is already saved to your account.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-sm leading-relaxed text-muted-foreground">
                Your stack will be saved to your account and kept in sync automatically on this
                device.
              </p>
              <Button
                className="h-10 w-full gap-2 bg-teal-500 text-white hover:bg-teal-600"
                onClick={handleSave}
                disabled={saving || saveStatus === 'saving'}
              >
                {saving || saveStatus === 'saving' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {saving || saveStatus === 'saving' ? 'Saving...' : 'Save Stack'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AuthModal open={authOpen} onOpenChange={setAuthOpen} next="/workspace" />
    </>
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
  } = useStack();
  const { user } = useAuth();
  const { switching } = useWorkspaces();
  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [compareOpen, setCompareOpen] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    if (!savedNotice) return;
    const timer = setTimeout(() => setSavedNotice(false), 4200);
    return () => clearTimeout(timer);
  }, [savedNotice]);

  if (switching) return <LoadingLayout />;

  if (!hydrated) return <LoadingLayout />;

  if (!activeStack) {
    return (
      <div className="space-y-6">
        <EmptyState />
      </div>
    );
  }

  const stack = activeStack;
  const providerCount = stack.categories.reduce((sum, c) => sum + c.providers.length, 0);

  return (
    <div className="space-y-6">
      <motion.header
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rounded-2xl glass p-6"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <StackBreadcrumbs
              items={[
                { label: 'Home', href: '/' },
                { label: 'My Stacks', href: '/workspace' },
                { label: stack.name },
              ]}
            />

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
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-foreground/5 text-muted-foreground transition-colors hover:border-teal-500/25 hover:text-foreground"
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSaveOpen(true)}
              disabled={saveStatus === 'saving' || providerCount === 0}
              className="h-9 gap-1.5 text-xs"
            >
              {saveStatus === 'saving' ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : saveStatus === 'saved' ? (
                <Check className="h-3.5 w-3.5 text-emerald-300" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              {saveStatus === 'saving'
                ? 'Saving...'
                : saveStatus === 'saved'
                  ? 'Saved'
                  : 'Save to Cloud'}
            </Button>
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
          <StackEditor onSave={() => setSaveOpen(true)} saveStatus={saveStatus} />
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
                          ? 'Not saved yet'
                          : 'Syncing...'}
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  {!user
                    ? 'Changes are stored locally on this device'
                    : saveStatus === 'saving'
                      ? 'Writing to your Stack2Set account'
                      : saveStatus === 'saved'
                        ? 'Changes are saved to your Stack2Set account'
                        : cloudSynced
                          ? 'Click Save Stack to store it in your account'
                          : 'Syncing your stacks...'}
                </p>
              </div>
            </div>
          </div>
          <SavedStacks />
          <FavoritesSection />
        </div>
      </div>

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
      <SaveToCloudDialog
        open={saveOpen}
        onOpenChange={setSaveOpen}
        stackName={stack.name}
        categoryCount={stack.categories.length}
        providerCount={providerCount}
        onSaved={() => setSavedNotice(true)}
      />

      <AnimatePresence>
        {savedNotice && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            role="status"
            aria-live="polite"
            className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-full border border-emerald-500/25 bg-[#0b0b14]/90 px-5 py-3 shadow-[0_18px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 ring-1 ring-emerald-500/30">
              <Check className="h-3.5 w-3.5 text-emerald-300" />
            </span>
            <div>
              <p className="text-sm font-semibold text-foreground">Saved to cloud</p>
              <p className="text-[11px] text-muted-foreground">
                Your stack is synced and available anywhere.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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
