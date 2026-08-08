'use client';

import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { AuthEmailForm } from '@/components/auth/auth-email-form';
import { useAuth } from '@/lib/auth/auth-context';
import { savePendingQuery } from '@/lib/auth/pending-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

/**
 * Login/signup modal shown when a guest tries to run a search. It carries the
 * saved query through the flow so the search resumes automatically after auth.
 */
export function AuthModal({
  open,
  onOpenChange,
  query,
  next = '/workspace',
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  query?: string | null;
  /** Fallback destination after auth when no pending search is saved. */
  next?: string;
}) {
  const { user } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('signup');

  useEffect(() => {
    if (open && query) savePendingQuery(query);
    if (open) setMode('signup');
  }, [open, query]);

  useEffect(() => {
    if (user && open) onOpenChange(false);
  }, [user, open, onOpenChange]);

  const title =
    mode === 'signup'
      ? 'Create a free account to continue your search'
      : 'Sign in to generate your personalized results';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-teal-500">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <DialogTitle className="text-center">{title}</DialogTitle>
          <DialogDescription className="text-center">
            {query ? (
              <>
                We saved <span className="font-medium text-foreground">&ldquo;{query}&rdquo;</span>.
                Sign in and we&apos;ll continue right where you left off.
              </>
            ) : (
              'Sync your stacks, save favorites, and pick up where you left off.'
            )}
          </DialogDescription>
        </DialogHeader>

        <AuthEmailForm
          mode={mode}
          next={next}
          onSwitchMode={() => setMode(mode === 'login' ? 'signup' : 'login')}
        />
      </DialogContent>
    </Dialog>
  );
}
