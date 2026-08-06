'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { AuthCard } from '@/components/auth/auth-card';
import { useAuth } from '@/lib/auth/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ForgotPasswordPage() {
  const { configured, resetPasswordForEmail } = useAuth();

  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const result = await resetPasswordForEmail(email.trim());
      if (result.error) {
        setError(result.error);
        return;
      }
      setSent(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthCard
      eyebrow="Recovery"
      title="Reset your password"
      subtitle="We'll email you a link to set a new password."
      footer={
        <>
          <Link href="/login" className="font-medium text-violet-400 hover:text-violet-300">
            Back to sign in
          </Link>
        </>
      }
    >
      {sent ? (
        <div className="flex flex-col items-center py-4 text-center">
          <CheckCircle2 className="h-10 w-10 text-emerald-400" />
          <h2 className="mt-3 text-lg font-semibold text-foreground">Check your email</h2>
          <p className="mt-1.5 max-w-xs text-sm leading-relaxed text-muted-foreground">
            If an account exists for <span className="text-foreground">{email}</span>, you&apos;ll
            receive a password reset link shortly.
          </p>
          <Button asChild className="mt-5 h-10 bg-gradient-to-r from-violet-500 to-blue-500 text-sm text-white hover:from-violet-600 hover:to-blue-600">
            <Link href="/login">Back to sign in</Link>
          </Button>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
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

          {error && (
            <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-400 ring-1 ring-rose-500/20">
              {error}
            </p>
          )}

          {!configured && (
            <p className="rounded-lg bg-amber-500/10 px-3 py-2 text-sm text-amber-400 ring-1 ring-amber-500/20">
              Supabase authentication is not configured yet.
            </p>
          )}

          <Button
            type="submit"
            disabled={submitting || !configured}
            className="h-10 w-full gap-2 bg-gradient-to-r from-violet-500 to-blue-500 text-sm text-white hover:from-violet-600 hover:to-blue-600"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Send reset link
          </Button>
        </form>
      )}
    </AuthCard>
  );
}
