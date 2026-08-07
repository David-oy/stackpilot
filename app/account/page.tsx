'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Check, Loader2, LogOut, Sparkles } from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function AccountPage() {
  const { user, loading, signOut, updatePassword } = useAuth();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);
  const [changeEmailError, setChangeEmailError] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordUpdated, setPasswordUpdated] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);

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

  const onUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordUpdated(false);
    if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters.');
      return;
    }
    if (password !== passwordConfirm) {
      setPasswordError('Passwords do not match.');
      return;
    }
    setUpdatingPassword(true);
    try {
      const result = await updatePassword(password);
      if (result.error) {
        setPasswordError(result.error);
        return;
      }
      setPassword('');
      setPasswordConfirm('');
      setPasswordUpdated(true);
    } finally {
      setUpdatingPassword(false);
    }
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
            <h3 className="text-sm font-semibold text-foreground">Password</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Set a new password for your account. You can also reach this step from a password
              reset email.
            </p>
            <form onSubmit={onUpdatePassword} className="mt-4 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="new-password" className="text-sm">
                  New password
                </Label>
                <Input
                  id="new-password"
                  type="password"
                  required
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="h-10"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirm-password" className="text-sm">
                  Confirm password
                </Label>
                <Input
                  id="confirm-password"
                  type="password"
                  required
                  autoComplete="new-password"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  placeholder="Re-enter your new password"
                  className="h-10"
                />
              </div>

              {passwordError && (
                <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-400 ring-1 ring-rose-500/20">
                  {passwordError}
                </p>
              )}

              {passwordUpdated && (
                <p className="flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300 ring-1 ring-emerald-500/20">
                  <Check className="h-4 w-4" /> Password updated successfully.
                </p>
              )}

              <Button
                type="submit"
                disabled={updatingPassword}
                className="h-9 gap-1.5 bg-gradient-to-r from-violet-500 to-blue-500 text-xs text-white hover:from-violet-600 hover:to-blue-600"
              >
                {updatingPassword && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Update password
              </Button>
            </form>
          </section>

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
