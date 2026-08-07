'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Bookmark,
  Check,
  Copy,
  FileUp,
  Layers,
  MoreHorizontal,
  Pencil,
  Play,
  Plus,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useStack } from '@/lib/stack-context';
import { useAuth } from '@/lib/auth/auth-context';
import {
  complexityDifficulty,
  computeStackHealth,
  formatCurrency,
  stackCategoryCount,
  stackProviderCount,
} from '@/lib/stacks/health';
import type { UserStack } from '@/lib/stacks/types';
import { importStackFromPdf } from '@/lib/stacks/import-pdf';
import { parseStackImport } from '@/lib/stacks/export';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

function formatDate(iso?: string): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function stackEstimatedCost(stack: UserStack): number {
  if (typeof stack.health?.estimatedMonthlyCost === 'number') {
    return stack.health.estimatedMonthlyCost;
  }
  return computeStackHealth(stack).estimatedMonthlyCost;
}

function StackCard({
  stack,
  index,
  onOpen,
}: {
  stack: UserStack;
  index: number;
  onOpen: (id: string) => void;
}) {
  const { activeStackId, renameStack, duplicateStack, deleteStack, setActiveStackId } = useStack();
  const [renaming, setRenaming] = useState(false);
  const [draftName, setDraftName] = useState('');
  const active = activeStackId === stack.id;
  const categoryCount = stackCategoryCount(stack);
  const providerCount = stackProviderCount(stack);
  const cost = stackEstimatedCost(stack);
  const difficulty = complexityDifficulty(stack.sourceAnalysis?.complexity);

  const openStack = () => {
    setActiveStackId(stack.id);
    onOpen(stack.id);
  };

  const handleRename = () => {
    if (draftName.trim()) renameStack(stack.id, draftName);
    setRenaming(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className={`group flex flex-col rounded-2xl border p-4 transition-colors ${
        active
          ? 'border-violet-500/30 bg-violet-500/[0.06]'
          : 'border-foreground/5 bg-foreground/[0.02] hover:border-violet-500/20'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        {renaming ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleRename();
            }}
            className="min-w-0 flex-1"
          >
            <Input
              autoFocus
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              onBlur={handleRename}
              className="h-8 text-sm"
            />
          </form>
        ) : (
          <button type="button" onClick={openStack} className="min-w-0 flex-1 text-left">
            <p className="truncate text-sm font-semibold text-foreground">{stack.name}</p>
            <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
              {stack.prompt || 'No prompt'}
            </p>
          </button>
        )}
        {active && (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-300 ring-1 ring-emerald-500/20">
            <Check className="h-2.5 w-2.5" /> Current
          </span>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              aria-label="Stack actions"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-foreground/5 text-muted-foreground transition-colors hover:border-violet-500/20 hover:text-foreground"
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuLabel className="truncate">{stack.name}</DropdownMenuLabel>
            <DropdownMenuItem
              onSelect={(e) => e.preventDefault()}
              onClick={openStack}
              className="cursor-pointer"
            >
              <Play className="mr-2 h-4 w-4" /> Open
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={(e) => e.preventDefault()}
              onClick={() => {
                setActiveStackId(stack.id);
                onOpen(stack.id);
              }}
              className="cursor-pointer"
            >
              <Layers className="mr-2 h-4 w-4" /> Continue Editing
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={(e) => e.preventDefault()}
              onClick={() => {
                setRenaming(true);
                setDraftName(stack.name);
              }}
              className="cursor-pointer"
            >
              <Pencil className="mr-2 h-4 w-4" /> Rename
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={(e) => e.preventDefault()}
              onClick={() => {
                const copy = duplicateStack(stack.id);
                if (copy) toast.success(`Duplicated "${copy.name}"`);
              }}
              className="cursor-pointer"
            >
              <Copy className="mr-2 h-4 w-4" /> Duplicate
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={(e) => e.preventDefault()}
              onClick={() => {
                deleteStack(stack.id);
                toast.success('Stack deleted');
              }}
              className="cursor-pointer text-rose-400 focus:text-rose-400"
            >
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <span className="rounded-md bg-foreground/[0.04] px-2 py-0.5 text-[11px] text-muted-foreground">
          {categoryCount} {categoryCount === 1 ? 'category' : 'categories'}
        </span>
        <span className="rounded-md bg-foreground/[0.04] px-2 py-0.5 text-[11px] text-muted-foreground">
          {providerCount} {providerCount === 1 ? 'provider' : 'providers'}
        </span>
        <span className="rounded-md bg-foreground/[0.04] px-2 py-0.5 text-[11px] text-muted-foreground">
          {formatCurrency(cost)}/mo est.
        </span>
        <span className="rounded-md bg-foreground/[0.04] px-2 py-0.5 text-[11px] text-muted-foreground">
          {difficulty} difficulty
        </span>
      </div>

      <p className="mt-3 text-[11px] text-muted-foreground/70">
        Created {formatDate(stack.createdAt)}
        {stack.updatedAt !== stack.createdAt && ` · Updated ${formatDate(stack.updatedAt)}`}
      </p>
    </motion.div>
  );
}

export function SavedStacks() {
  const router = useRouter();
  const { stacks, createStack, importStack } = useStack();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportFile = async (file: File) => {
    try {
      const stack =
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

  return (
    <section id="saved-stacks" className="scroll-mt-24">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500/20 to-blue-500/20 ring-1 ring-violet-500/20">
            <Bookmark className="h-4 w-4 text-violet-300" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">Saved Stacks</h2>
            <p className="text-[11px] text-muted-foreground">
              {user ? 'Stored in your Stack2Set account' : 'Saved on this device'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-xs"
            onClick={() => fileInputRef.current?.click()}
          >
            <FileUp className="h-3.5 w-3.5" /> Import
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-xs"
            onClick={() => {
              const stack = createStack();
              if (stack) toast.success(`Created "${stack.name}"`);
            }}
          >
            <Plus className="h-3.5 w-3.5" /> New
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

      {stacks.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-foreground/10 py-14 text-center">
          <p className="text-sm text-muted-foreground">No saved stacks yet.</p>
          <p className="mt-1 text-xs text-muted-foreground/70">
            Analyze a project or create one to get started.
          </p>
          <Link
            href="/"
            className="mt-4 inline-flex items-center gap-1.5 text-xs text-violet-400 transition-colors hover:text-violet-300"
          >
            <Play className="h-3.5 w-3.5" /> Start a New Build
          </Link>
        </div>
      ) : (
        <div className="mt-4 grid gap-3">
          {stacks.map((stack, i) => (
            <StackCard key={stack.id} stack={stack} index={i} onOpen={openStack} />
          ))}
        </div>
      )}
    </section>
  );
}
