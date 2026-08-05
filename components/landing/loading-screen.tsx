'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Sparkles, Loader2 } from 'lucide-react';
import { loadingSteps } from '@/lib/categories';

export function LoadingScreen({
  query,
  autoNavigate = true,
}: {
  query: string;
  autoNavigate?: boolean;
}) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  useEffect(() => {
    const stepDuration = 700;
    const timers: ReturnType<typeof setTimeout>[] = [];

    loadingSteps.forEach((_, i) => {
      timers.push(
        setTimeout(() => {
          setCompletedSteps((prev) => [...prev, i - 1]);
          setCurrentStep(i);
        }, i * stepDuration),
      );
    });

    timers.push(
      setTimeout(() => {
        setCompletedSteps((prev) => [...prev, loadingSteps.length - 1]);
      }, loadingSteps.length * stepDuration),
    );

    timers.push(
      setTimeout(() => {
        if (autoNavigate) {
          router.push(`/results?q=${encodeURIComponent(query)}`);
        }
      }, loadingSteps.length * stepDuration + 600),
    );

    return () => timers.forEach(clearTimeout);
  }, [query, router, autoNavigate]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
      <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-600/15 blur-[120px]" />

      <div className="w-full max-w-md px-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="mb-10 flex flex-col items-center"
        >
          <div className="relative mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-blue-500">
            <motion.div
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 rounded-2xl bg-gradient-to-br from-violet-500 to-blue-500 blur-md opacity-60"
            />
            <Sparkles className="relative h-8 w-8 text-white" />
          </div>
          <h2 className="text-xl font-semibold text-foreground">Analyzing your project</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {query ? `"${query}"` : 'Your idea'}
          </p>
        </motion.div>

        <div className="space-y-4">
          {loadingSteps.map((step, i) => {
            const isCompleted = completedSteps.includes(i);
            const isActive = currentStep === i && !isCompleted;
            const isPending = i > currentStep;

            return (
              <motion.div
                key={step}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-3"
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full">
                  {isCompleted ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/20 ring-1 ring-emerald-500/40"
                    >
                      <Check className="h-4 w-4 text-emerald-400" />
                    </motion.div>
                  ) : isActive ? (
                    <Loader2 className="h-5 w-5 animate-spin text-violet-400" />
                  ) : (
                    <div className="h-2 w-2 rounded-full bg-foreground/15" />
                  )}
                </div>
                <span
                  className={`text-sm transition-colors duration-300 ${
                    isCompleted
                      ? 'text-foreground'
                      : isActive
                        ? 'text-foreground'
                        : isPending
                          ? 'text-muted-foreground/50'
                          : 'text-muted-foreground'
                  }`}
                >
                  {step}
                </span>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-8 h-1 w-full overflow-hidden rounded-full bg-foreground/5">
          <motion.div
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: loadingSteps.length * 0.7, ease: 'linear' }}
            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-blue-500"
          />
        </div>
      </div>
    </div>
  );
}
