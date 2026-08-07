'use client';

import Link from 'next/link';
import { AuthCard } from '@/components/auth/auth-card';
import { AuthEmailForm } from '@/components/auth/auth-email-form';

export default function SignupPage() {
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
      <AuthEmailForm mode="signup" />
    </AuthCard>
  );
}
