'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Check, Layers, X, Sparkles } from 'lucide-react';
import { categories } from '@/lib/categories';
import { useStack } from '@/lib/stack-context';

export function CurrentStack() {
  const { stack, removeFromStack, completedCount, totalCount } = useStack();
  const progress = Math.round((completedCount / totalCount) * 100);

  return (
    <div className="sticky top-24">
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="glass rounded-2xl p-6"
      >
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500/20 to-blue-500/20 ring-1 ring-violet-500/20">
            <Layers className="h-5 w-5 text-violet-300" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">My Current Stack</h3>
            <p className="text-xs text-muted-foreground">Build as you go</p>
          </div>
        </div>

        <div className="mt-5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium text-white">{completedCount}/{totalCount} Categories</span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
            <motion.div
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-blue-500"
            />
          </div>
        </div>

        <div className="mt-5 space-y-2">
          {categories.map((cat, i) => {
            const entry = stack[cat.id];
            return (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.04 }}
                className={`group flex items-center justify-between rounded-lg border px-3 py-2.5 transition-colors ${
                  entry
                    ? 'border-violet-500/20 bg-violet-500/[0.04]'
                    : 'border-white/5 bg-white/[0.02]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <cat.icon className={`h-4 w-4 ${entry ? cat.iconColor : 'text-muted-foreground/50'}`} />
                  <span className="text-xs text-muted-foreground">{cat.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <AnimatePresence mode="wait">
                    {entry ? (
                      <motion.div
                        key="filled"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="flex items-center gap-1.5"
                      >
                        <span className="text-xs font-medium text-white">{entry.providerName}</span>
                        <button
                          onClick={() => removeFromStack(cat.id)}
                          className="flex h-4 w-4 items-center justify-center rounded-full bg-white/5 text-muted-foreground transition-colors hover:bg-white/10 hover:text-white"
                          aria-label="Remove from stack"
                        >
                          <X className="h-2.5 w-2.5" />
                        </button>
                      </motion.div>
                    ) : (
                      <motion.span
                        key="empty"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-xs text-muted-foreground/40"
                      >
                        None Selected
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </div>

        <button className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-violet-500 to-blue-500 py-2.5 text-xs font-medium text-white transition-opacity hover:opacity-90">
          <Sparkles className="h-3.5 w-3.5" />
          Export Stack
        </button>
      </motion.div>
    </div>
  );
}
