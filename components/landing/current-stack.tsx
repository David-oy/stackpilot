'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Check, Layers, MoreHorizontal, X } from 'lucide-react';
import Link from 'next/link';
import { getCategoryMeta } from '@/lib/categories';
import { useStack } from '@/lib/stack-context';
import { computeStackHealth, formatCurrency } from '@/lib/stacks/health';
import { CostBreakdownDialog } from '@/components/workspace/cost-breakdown';

export function CurrentStack() {
  const { activeStack, removeProvider, completedCount, totalCount } = useStack();
  const progress =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const health = activeStack ? computeStackHealth(activeStack) : null;

  return (
    <div className="sticky top-24">
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="glass rounded-2xl p-6"
      >
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500/20 to-cyan-500/20 ring-1 ring-teal-500/20">
            <Layers className="h-5 w-5 text-teal-300" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">My Current Stack</h3>
            <p className="text-xs text-muted-foreground">Build as you go</p>
          </div>
        </div>

        <div className="mt-5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium text-foreground">
              {completedCount}/{totalCount} Categories
            </span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-foreground/5">
            <motion.div
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="h-full rounded-full bg-teal-500"
            />
          </div>
        </div>

        {activeStack && (
          <div className="mt-4 flex items-center justify-between rounded-lg border border-foreground/5 bg-foreground/[0.02] px-3 py-2.5">
            <div className="min-w-0">
              <p className="text-[11px] text-muted-foreground">Est. Monthly Cost</p>
              <p className="truncate text-sm font-semibold text-foreground">
                {health ? formatCurrency(health.estimatedMonthlyCost) : '$0'}
              </p>
            </div>
            <CostBreakdownDialog stack={activeStack}>
              <button
                type="button"
                aria-label="View monthly cost breakdown"
                title="View cost breakdown"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-foreground/5 text-muted-foreground transition-colors hover:border-teal-500/25 hover:text-foreground"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </CostBreakdownDialog>
          </div>
        )}

        {!activeStack ? (
          <div className="mt-5 rounded-xl border border-dashed border-foreground/10 py-6 text-center">
            <p className="text-xs text-muted-foreground">No stack yet.</p>
            <Link
              href="/workspace"
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-teal-500 px-4 py-2 text-xs font-medium text-white transition-opacity hover:opacity-90"
            >
              Open Workspace <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        ) : (
          <div className="mt-5 space-y-2">
            {activeStack.categories.map((cat, i) => {
              const meta = getCategoryMeta(cat.categoryId);
              const count = cat.providers.length;
              const selected = count > 0;
              return (
                <motion.div
                  key={cat.categoryId}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.04 }}
                  className={`group flex items-center justify-between rounded-lg border px-3 py-2.5 transition-colors ${
                    selected
                      ? 'border-teal-500/20 bg-teal-500/[0.04]'
                      : 'border-foreground/5 bg-foreground/[0.02]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <meta.icon
                      className={`h-4 w-4 ${selected ? meta.iconColor : 'text-muted-foreground/50'}`}
                    />
                    <span className="text-xs text-muted-foreground">{cat.categoryName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {selected ? (
                      <div className="flex items-center gap-1.5">
                        <span className="max-w-[120px] truncate text-xs font-medium text-foreground">
                          {count > 1
                            ? `${cat.providers[0]?.name} +${count - 1}`
                            : cat.providers[0]?.name}
                        </span>
                        <button
                          onClick={() => removeProvider(cat.categoryId, cat.providers[0]?.providerId ?? '')}
                          className="flex h-4 w-4 items-center justify-center rounded-full bg-foreground/5 text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground"
                          aria-label="Remove from stack"
                        >
                          <X className="h-2.5 w-2.5" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground/40">None Selected</span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        <Link
          href="/workspace"
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-teal-500 py-2.5 text-xs font-medium text-white transition-opacity hover:opacity-90"
        >
          <Check className="h-3.5 w-3.5" />
          Open Workspace
        </Link>
      </motion.div>
    </div>
  );
}
