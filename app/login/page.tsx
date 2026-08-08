'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';
import { AuthCard } from '@/components/auth/auth-card';
import { AuthEmailForm } from '@/components/auth/auth-email-form';

function LoginContent() {
  const searchParams = useSearchParams();
  const next = searchParams.get('next') ?? '/workspace';

  return (
    <AuthCard
      eyebrow="Welcome back"
      title="Sign in to Stack2Set"
      subtitle="Sync your stacks, save favorites, and pick up where you left off."
      footer={
        <>
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="font-medium text-teal-400 hover:text-teal-300">
            Create one
          </Link>
        </>
      }
    >
      <AuthEmailForm mode="login" next={next} />
    </AuthCard>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}
