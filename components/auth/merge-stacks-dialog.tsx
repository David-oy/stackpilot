'use client';

import { CloudUpload, Layers } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export function MergeStacksDialog({
  open,
  onOpenChange,
  onMerge,
  count,
  email,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMerge: () => void;
  count: number;
  email: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-blue-500/20 ring-1 ring-violet-500/20">
            <CloudUpload className="h-5 w-5 text-violet-300" />
          </div>
          <DialogTitle className="text-lg">Merge your stacks into the cloud?</DialogTitle>
          <DialogDescription>
            You have {count} stack{count === 1 ? '' : 's'} saved on this device. Merge them into
            your account so they sync across all your devices?
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-start gap-3 rounded-xl border border-foreground/5 bg-foreground/[0.02] p-3.5">
          <Layers className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <p className="text-xs leading-relaxed text-muted-foreground">
            Signing in as <span className="font-medium text-foreground">{email}</span>. If you skip,
            your stacks stay on this device only.
          </p>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-9 text-xs"
            onClick={() => onOpenChange(false)}
          >
            Not now
          </Button>
          <Button
            type="button"
            className="h-9 gap-1.5 bg-gradient-to-r from-violet-500 to-blue-500 text-xs text-white hover:from-violet-600 hover:to-blue-600"
            onClick={onMerge}
          >
            <CloudUpload className="h-3.5 w-3.5" /> Merge my stacks
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
