'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export function AuthCard({
  eyebrow,
  title,
  subtitle,
  children,
  footer,
  className,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 pt-16">
      <div className="pointer-events-none absolute left-1/2 top-1/3 -z-10 h-[420px] w-[680px] -translate-x-1/2 rounded-full bg-violet-600/10 blur-[120px]" />
      <div className={cn('w-full max-w-md', className)}>
        <div className="mb-8 flex flex-col items-center text-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-blue-500">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-semibold tracking-tight text-foreground">
              Stack<span className="gradient-text">2set</span>
            </span>
          </Link>
        </div>

        <div className="glass rounded-2xl p-8">
          <p className="text-xs font-medium uppercase tracking-wide text-violet-400">{eyebrow}</p>
          <h1 className="mt-1.5 text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </div>

        {footer && (
          <p className="mt-5 text-center text-sm text-muted-foreground">{footer}</p>
        )}
      </div>
    </main>
  );
}
