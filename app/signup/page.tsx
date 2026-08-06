'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { AuthCard } from '@/components/auth/auth-card';
import { OAuthButtons } from '@/components/auth/oauth-buttons';
import { useAuth } from '@/lib/auth/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

export default function SignupPage() {
  const router = useRouter();
  const { configured, signUp } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const result = await signUp(email.trim(), password);
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.needsConfirmation) {
        setConfirmed(true);
        return;
      }
      router.push('/workspace');
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthCard
      eyebrow="Get started"
      title="Create your account"
      subtitle="Save stacks to the cloud, merge your local work, and build with confidence."
      footer={
        <>
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-violet-400 hover:text-violet-300">
            Sign in
          </Link>
        </>
      }
    >
      {confirmed ? (
        <div className="flex flex-col items-center py-4 text-center">
          <CheckCircle2 className="h-10 w-10 text-emerald-400" />
          <h2 className="mt-3 text-lg font-semibold text-foreground">Check your email</h2>
          <p className="mt-1.5 max-w-xs text-sm leading-relaxed text-muted-foreground">
            We sent a confirmation link to <span className="text-foreground">{email}</span>. Click
            it to verify your account, then sign in.
          </p>
          <Button asChild className="mt-5 h-10 bg-gradient-to-r from-violet-500 to-blue-500 text-sm text-white hover:from-violet-600 hover:to-blue-600">
            <Link href="/login">Back to sign in</Link>
          </Button>
        </div>
      ) : (
        <>
          <OAuthButtons />

          <div className="my-5 flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground">or</span>
            <Separator className="flex-1" />
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-sm">
                Name (optional)
              </Label>
              <Input
                id="name"
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ada Lovelace"
                className="h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="h-10"
              />
            </div>

            {error && (
              <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-400 ring-1 ring-rose-500/20">
                {error}
              </p>
            )}

            {!configured && (
              <p className="rounded-lg bg-amber-500/10 px-3 py-2 text-sm text-amber-400 ring-1 ring-amber-500/20">
                Supabase authentication is not configured yet. Add NEXT_PUBLIC_SUPABASE_URL and
                NEXT_PUBLIC_SUPABASE_ANON_KEY to your environment.
              </p>
            )}

            <Button
              type="submit"
              disabled={submitting || !configured}
              className="h-10 w-full gap-2 bg-gradient-to-r from-violet-500 to-blue-500 text-sm text-white hover:from-violet-600 hover:to-blue-600"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Create account
            </Button>
          </form>
        </>
      )}
    </AuthCard>
  );
}
