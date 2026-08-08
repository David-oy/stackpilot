'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bookmark, FileUp, Play, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useStack } from '@/lib/stack-context';
import { useAuth } from '@/lib/auth/auth-context';
import type { UserStack } from '@/lib/stacks/types';
import { importStackFromPdf } from '@/lib/stacks/import-pdf';
import { parseStackImport } from '@/lib/stacks/export';
import { StackCard } from './stack-card';
import { Button } from '@/components/ui/button';

export function SavedStacks() {
  const router = useRouter();
  const { stacks, createStack, importStack } = useStack();
  const { user } = useAuth();
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

  return (
    <section id="saved-stacks" className="scroll-mt-24">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500/20 to-cyan-500/20 ring-1 ring-teal-500/20">
            <Bookmark className="h-4 w-4 text-teal-300" />
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
            className="mt-4 inline-flex items-center gap-1.5 text-xs text-teal-400 transition-colors hover:text-teal-300"
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
