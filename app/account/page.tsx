'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, LogOut, Sparkles } from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import { Button } from '@/components/ui/button';

export default function AccountPage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);
  const [changeEmailError, setChangeEmailError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login?next=/account');
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </main>
    );
  }

  const fullName =
    (user.user_metadata?.full_name as string | undefined) ??
    (user.user_metadata?.name as string | undefined) ??
    '';
  const displayName = fullName || user.email?.split('@')[0] || 'User';
  const initial = displayName.charAt(0).toUpperCase();
  const emailVerified = !!user.email_confirmed_at;

  const onSignOut = async () => {
    setSigningOut(true);
    await signOut();
    router.push('/');
    router.refresh();
  };

  return (
    <main className="relative min-h-screen overflow-hidden px-6 pt-24 pb-16">
      <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[400px] w-[700px] -translate-x-1/2 rounded-full bg-violet-600/10 blur-[120px]" />
      <div className="mx-auto max-w-2xl">
        <p className="text-xs font-medium uppercase tracking-wide text-violet-400">Account</p>
        <h1 className="mt-1.5 text-3xl font-semibold tracking-tight text-foreground">
          Your profile
        </h1>

        <div className="mt-8 space-y-6">
          <section className="glass rounded-2xl p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-blue-500 text-2xl font-bold text-white shadow-lg">
                {initial}
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-lg font-semibold text-foreground">
                  {displayName || 'Stack2Set user'}
                </h2>
                <p className="truncate text-sm text-muted-foreground">{user.email}</p>
                {emailVerified ? (
                  <span className="mt-1 inline-flex items-center rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-medium text-emerald-300 ring-1 ring-emerald-500/20">
                    Email verified
                  </span>
                ) : (
                  <span className="mt-1 inline-flex items-center rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-medium text-amber-300 ring-1 ring-amber-500/20">
                    Email not verified
                  </span>
                )}
              </div>
            </div>
          </section>

          <section className="glass rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-foreground">Workspace</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Your stacks are synced to the cloud and stay available on any device.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button asChild className="h-9 gap-1.5 bg-gradient-to-r from-violet-500 to-blue-500 text-xs text-white hover:from-violet-600 hover:to-blue-600">
                <Link href="/workspace">
                  <Sparkles className="h-3.5 w-3.5" /> Open Workspace
                </Link>
              </Button>
            </div>
          </section>

          {changeEmailError && (
            <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-400 ring-1 ring-rose-500/20">
              {changeEmailError}
            </p>
          )}

          <section className="glass rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-foreground">Danger zone</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Sign out of this device. Your stacks remain saved in the cloud.
            </p>
            <Button
              variant="outline"
              className="mt-4 h-9 gap-1.5 text-xs text-muted-foreground hover:text-rose-300"
              onClick={onSignOut}
              disabled={signingOut}
            >
              {signingOut ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LogOut className="h-3.5 w-3.5" />}
              Sign out
            </Button>
          </section>
        </div>
      </div>
    </main>
  );
}
