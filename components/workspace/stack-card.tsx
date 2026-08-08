'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Check,
  Copy,
  Layers,
  MoreHorizontal,
  Pencil,
  Play,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useStack } from '@/lib/stack-context';
import {
  complexityDifficulty,
  computeStackHealth,
  formatCurrency,
  stackCategoryCount,
  stackProviderCount,
} from '@/lib/stacks/health';
import type { UserStack } from '@/lib/stacks/types';
import { Input } from '@/components/ui/input';
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

export function StackCard({
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
          ? 'border-teal-500/30 bg-teal-500/[0.06]'
          : 'border-foreground/5 bg-foreground/[0.02] hover:border-teal-500/25'
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
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-foreground/5 text-muted-foreground transition-colors hover:border-teal-500/25 hover:text-foreground"
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
