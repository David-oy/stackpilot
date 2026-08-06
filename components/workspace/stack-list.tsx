'use client';

import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Check,
  Copy,
  FileUp,
  History,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useStack } from '@/lib/stack-context';
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

function timeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function StackList() {
  const {
    stacks,
    activeStackId,
    createStack,
    duplicateStack,
    deleteStack,
    setActiveStackId,
    renameStack,
    importStack,
  } = useStack();
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleRename = (id: string) => {
    if (draftName.trim()) renameStack(id, draftName);
    setRenamingId(null);
  };

  const handleImportFile = async (file: File) => {
    try {
      const stack =
        file.name.toLowerCase().endsWith('.pdf')
          ? await importStackFromPdf(file)
          : parseStackImport(await file.text());
      if (!stack) throw new Error('Could not read that file as a StackPilot stack.');
      importStack(stack);
      toast.success(`Imported "${stack.name}"`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not import that file.');
    }
  };

  return (
    <div className="rounded-2xl glass p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500/20 to-blue-500/20 ring-1 ring-violet-500/20">
            <History className="h-4 w-4 text-violet-300" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">My Stacks</h3>
            <p className="text-[11px] text-muted-foreground">Saved on this device</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => fileInputRef.current?.click()}
            aria-label="Import stack"
            title="Import stack"
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-foreground/5 text-muted-foreground transition-colors hover:border-violet-500/20 hover:text-foreground"
          >
            <FileUp className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => createStack()}
            aria-label="Create new stack"
            title="Create new stack"
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-foreground/5 text-muted-foreground transition-colors hover:border-violet-500/20 hover:text-foreground"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
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

      <div className="mt-4 space-y-2">
        {stacks.length === 0 ? (
          <p className="rounded-xl border border-dashed border-foreground/10 py-8 text-center text-xs text-muted-foreground">
            No stacks yet. Analyze a project or create one.
          </p>
        ) : (
          stacks.map((stack, i) => {
            const active = stack.id === activeStackId;
            return (
              <motion.div
                key={stack.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className={`group rounded-xl border px-3 py-2.5 transition-colors ${
                  active
                    ? 'border-violet-500/30 bg-violet-500/[0.06]'
                    : 'border-foreground/5 bg-foreground/[0.02] hover:border-violet-500/20'
                }`}
              >
                {renamingId === stack.id ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleRename(stack.id);
                    }}
                    className="flex items-center gap-2"
                  >
                    <Input
                      autoFocus
                      value={draftName}
                      onChange={(e) => setDraftName(e.target.value)}
                      onBlur={() => handleRename(stack.id)}
                      className="h-8 text-xs"
                    />
                  </form>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActiveStackId(stack.id)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <p className="truncate text-xs font-medium text-foreground">{stack.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {stack.categories.reduce((sum, c) => sum + c.providers.length, 0)} providers ·{' '}
                        {timeAgo(stack.updatedAt)}
                      </p>
                    </button>
                    {active && <Check className="h-3.5 w-3.5 shrink-0 text-violet-400" />}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          aria-label="Stack actions"
                          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-opacity hover:bg-foreground/[0.05] hover:text-foreground group-hover:opacity-100"
                        >
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuLabel>{stack.name}</DropdownMenuLabel>
                        <DropdownMenuItem
                          onSelect={(e) => e.preventDefault()}
                          onClick={() => {
                            setRenamingId(stack.id);
                            setDraftName(stack.name);
                          }}
                        >
                          <Pencil className="mr-2 h-4 w-4" /> Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={(e) => e.preventDefault()}
                          onClick={() => {
                            const copy = duplicateStack(stack.id);
                            if (copy) toast.success(`Duplicated "${copy.name}"`);
                          }}
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
                          className="text-rose-400 focus:text-rose-400"
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
