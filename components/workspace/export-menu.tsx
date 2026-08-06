'use client';

import { useState } from 'react';
import {
  Check,
  ClipboardCopy,
  Download,
  FileJson,
  FileText,
  Link2,
  Loader2,
  Printer,
  Share2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useStack } from '@/lib/stack-context';
import { computeStackHealth } from '@/lib/stacks/health';
import {
  copyToClipboard,
  downloadText,
  printStackHtml,
  toJsonExport,
  toMarkdown,
} from '@/lib/stacks/export';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

export function ExportMenu({
  onShare,
  disabled,
}: {
  onShare: (url: string) => void;
  disabled?: boolean;
}) {
  const { activeStack } = useStack();
  const [creating, setCreating] = useState(false);

  const stack = activeStack;
  const health = stack ? computeStackHealth(stack) : null;

  if (!stack || !health) return null;

  const createShare = async () => {
    setCreating(true);
    try {
      const response = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stack }),
      });
      if (!response.ok) throw new Error('Failed to create share link.');
      const data = (await response.json()) as { url: string };
      onShare(data.url);
      toast.success('Share link created');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create share link.');
    } finally {
      setCreating(false);
    }
  };

  const copyMarkdown = async () => {
    await copyToClipboard(toMarkdown(stack));
    toast.success('Stack copied as Markdown');
  };

  const copyJson = async () => {
    await copyToClipboard(toJsonExport(stack, health));
    toast.success('Stack copied as JSON');
  };

  const downloadJson = () => {
    downloadText(`${slugifyFileName(stack.name)}.json`, toJsonExport(stack, health), 'application/json');
    toast.success('Stack exported as JSON');
  };

  const downloadMarkdown = () => {
    downloadText(`${slugifyFileName(stack.name)}.md`, toMarkdown(stack), 'text/markdown');
    toast.success('Stack exported as Markdown');
  };

  const print = () => {
    printStackHtml(stack, health);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled} className="h-9 gap-1.5 text-xs">
          {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Share2 className="h-3.5 w-3.5" />}
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Share & Export</DropdownMenuLabel>
        <DropdownMenuItem onSelect={(e) => e.preventDefault()} onClick={createShare}>
          <Link2 className="mr-2 h-4 w-4" /> Share Link
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={(e) => e.preventDefault()} onClick={copyMarkdown}>
          <ClipboardCopy className="mr-2 h-4 w-4" /> Copy Markdown
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={(e) => e.preventDefault()} onClick={copyJson}>
          <Check className="mr-2 h-4 w-4" /> Copy JSON
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={(e) => e.preventDefault()} onClick={downloadJson}>
          <FileJson className="mr-2 h-4 w-4" /> Download JSON
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={(e) => e.preventDefault()} onClick={downloadMarkdown}>
          <FileText className="mr-2 h-4 w-4" /> Download Markdown
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={(e) => e.preventDefault()} onClick={print}>
          <Download className="mr-2 h-4 w-4" /> Export PDF (via print)
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={(e) => e.preventDefault()} onClick={print}>
          <Printer className="mr-2 h-4 w-4" /> Print
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function slugifyFileName(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'stack'
  );
}
