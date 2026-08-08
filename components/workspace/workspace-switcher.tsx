'use client';

import { useEffect, useState } from 'react';
import { Archive, Check, ChevronsUpDown, Copy, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useWorkspaces } from '@/lib/workspaces/context';
import {
  DEFAULT_WORKSPACE_COLOR,
  DEFAULT_WORKSPACE_ICON,
  WORKSPACE_COLORS,
  WORKSPACE_ICONS,
} from '@/lib/workspaces/types';
import type { Workspace, WorkspaceInput } from '@/lib/workspaces/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function WorkspaceIcon({
  workspace,
  size = 'md',
}: {
  workspace: Pick<Workspace, 'icon' | 'color'>;
  size?: 'sm' | 'md' | 'lg';
}) {
  const sizeClass =
    size === 'sm' ? 'h-6 w-6 text-xs' : size === 'lg' ? 'h-10 w-10 text-xl' : 'h-8 w-8 text-base';
  return (
    <div
      className={cn('flex shrink-0 items-center justify-center rounded-lg font-semibold', sizeClass)}
      style={{ backgroundColor: `${workspace.color}1f`, color: workspace.color }}
      aria-hidden="true"
    >
      <span>{workspace.icon || DEFAULT_WORKSPACE_ICON}</span>
    </div>
  );
}

type DialogMode = { mode: 'create' } | { mode: 'rename'; workspace: Workspace } | null;

function WorkspaceFormDialog({
  state,
  onOpenChange,
}: {
  state: DialogMode;
  onOpenChange: (open: boolean) => void;
}) {
  const { createWorkspace, renameWorkspace, switching } = useWorkspaces();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState<string>(DEFAULT_WORKSPACE_ICON);
  const [color, setColor] = useState<string>(DEFAULT_WORKSPACE_COLOR);

  useEffect(() => {
    if (!state) return;
    const seed = state.mode === 'rename' ? state.workspace : null;
    setName(seed?.name ?? '');
    setDescription(seed?.description ?? '');
    setIcon(seed?.icon ?? DEFAULT_WORKSPACE_ICON);
    setColor(seed?.color ?? DEFAULT_WORKSPACE_COLOR);
  }, [state]);

  if (!state) return null;

  const isRename = state.mode === 'rename';

  const submit = async () => {
    const clean = name.trim();
    if (!clean) return;
    const input: WorkspaceInput = {
      name: clean,
      description: description.trim(),
      icon,
      color,
    };
    if (isRename) {
      await renameWorkspace(state.workspace.id, input);
      toast.success('Workspace updated');
    } else {
      const created = await createWorkspace(input);
      if (created) toast.success(`Created "${created.name}"`);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isRename ? 'Rename workspace' : 'Create workspace'}</DialogTitle>
          <DialogDescription>
            {isRename
              ? 'Update the name, icon, or accent color of this workspace.'
              : 'Give your new workspace a name, icon, and accent color.'}
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
          className="space-y-4"
        >
          <div className="space-y-1.5">
            <label
              htmlFor="workspace-name"
              className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
            >
              Name
            </label>
            <Input
              id="workspace-name"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Startup Ideas"
              maxLength={60}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Icon
            </label>
            <div className="flex flex-wrap gap-1.5">
              {WORKSPACE_ICONS.map((candidate) => (
                <button
                  key={candidate}
                  type="button"
                  onClick={() => setIcon(candidate)}
                  aria-label={`Icon ${candidate}`}
                  aria-pressed={icon === candidate}
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-lg border text-base transition-colors',
                    icon === candidate
                      ? 'border-teal-500/50 bg-teal-500/10'
                      : 'border-foreground/10 hover:border-foreground/25',
                  )}
                >
                  {candidate}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Color
            </label>
            <div className="flex flex-wrap gap-2">
              {WORKSPACE_COLORS.map((candidate) => (
                <button
                  key={candidate}
                  type="button"
                  onClick={() => setColor(candidate)}
                  aria-label={`Color ${candidate}`}
                  aria-pressed={color === candidate}
                  className={cn(
                    'h-8 w-8 rounded-full ring-2 ring-offset-2 ring-offset-background transition-transform',
                    color === candidate ? 'scale-110 ring-foreground/70' : 'ring-transparent',
                  )}
                  style={{ backgroundColor: candidate }}
                />
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || switching} className="gap-1.5">
              {switching && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {isRename ? 'Save changes' : 'Create workspace'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteWorkspaceAlert({
  workspace,
  onOpenChange,
}: {
  workspace: Workspace | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { deleteWorkspace } = useWorkspaces();
  if (!workspace) return null;
  return (
    <AlertDialog open onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete “{workspace.name}”?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently deletes the workspace and everything inside it — stacks, favorites,
            and history. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              deleteWorkspace(workspace.id);
              toast.success(`Deleted "${workspace.name}"`);
            }}
            className="bg-rose-500 text-white hover:bg-rose-600"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function WorkspaceSwitcher({ collapsed = false }: { collapsed?: boolean }) {
  const {
    workspaces,
    currentWorkspace,
    switching,
    switchWorkspace,
    archiveWorkspace,
    duplicateWorkspace,
  } = useWorkspaces();
  const [dialog, setDialog] = useState<DialogMode>(null);
  const [deleteTarget, setDeleteTarget] = useState<Workspace | null>(null);

  if (!currentWorkspace) return null;

  const others = workspaces.filter((ws) => ws.id !== currentWorkspace.id);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label="Switch workspace"
            title={currentWorkspace.name}
            className={cn(
              'flex w-full items-center gap-2 rounded-lg border border-foreground/5 bg-foreground/[0.02] px-2 py-1.5 text-sm transition-colors hover:border-teal-500/30 hover:bg-foreground/[0.04]',
              collapsed && 'justify-center px-0 py-2',
            )}
          >
            <WorkspaceIcon workspace={currentWorkspace} />
            {!collapsed && (
              <>
                <span className="min-w-0 flex-1 truncate text-left font-medium text-foreground">
                  {currentWorkspace.name}
                </span>
                {switching ? (
                  <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-muted-foreground" />
                ) : (
                  <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                )}
              </>
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" side="bottom" className="z-[70] w-64">
          <DropdownMenuLabel>Current workspace</DropdownMenuLabel>
          <DropdownMenuItem onSelect={() => switchWorkspace(currentWorkspace.id)} className="gap-2">
            <WorkspaceIcon workspace={currentWorkspace} size="sm" />
            <span className="min-w-0 flex-1 truncate">{currentWorkspace.name}</span>
            <Check className="h-4 w-4 shrink-0 text-teal-400" />
          </DropdownMenuItem>

          {others.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
              {others.map((ws) => (
                <DropdownMenuItem key={ws.id} onSelect={() => switchWorkspace(ws.id)} className="gap-2">
                  <WorkspaceIcon workspace={ws} size="sm" />
                  <span className="min-w-0 flex-1 truncate">{ws.name}</span>
                </DropdownMenuItem>
              ))}
            </>
          )}

          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setDialog({ mode: 'create' })} className="gap-2">
            <Plus className="h-4 w-4 shrink-0" /> Create workspace
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => setDialog({ mode: 'rename', workspace: currentWorkspace })}
            className="gap-2"
          >
            <Pencil className="h-4 w-4 shrink-0" /> Rename
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => {
              void duplicateWorkspace(currentWorkspace.id).then((ws) => {
                if (ws) toast.success(`Duplicated "${ws.name}"`);
              });
            }}
            className="gap-2"
          >
            <Copy className="h-4 w-4 shrink-0" /> Duplicate
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => {
              archiveWorkspace(currentWorkspace.id);
              toast.success('Workspace archived');
            }}
            disabled={workspaces.length <= 1}
            className="gap-2"
          >
            <Archive className="h-4 w-4 shrink-0" /> Archive
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => setDeleteTarget(currentWorkspace)}
            disabled={workspaces.length <= 1}
            className="gap-2 text-rose-400 focus:text-rose-300"
          >
            <Trash2 className="h-4 w-4 shrink-0" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <WorkspaceFormDialog
        state={dialog}
        onOpenChange={(open) => {
          if (!open) setDialog(null);
        }}
      />
      <DeleteWorkspaceAlert
        workspace={deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      />
    </>
  );
}
