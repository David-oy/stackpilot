'use client';

import { motion } from 'framer-motion';
import { Check, Layers, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { LucideIcon } from 'lucide-react';
import { categories, getCategoryMeta } from '@/lib/categories';
import type { StackAnalysis } from '@/lib/types';
import { useStack } from '@/lib/stack-context';
import { useAnalysisContext } from '@/lib/analysis-context';

type StackItem = {
  id: string;
  name: string;
  icon: LucideIcon;
  iconColor: string;
  recommended: string;
};

export function RecommendedStack({ analysis }: { analysis?: StackAnalysis }) {
  const router = useRouter();
  const { createStackFromAnalysis } = useStack();
  const { query } = useAnalysisContext();

  const items: StackItem[] = analysis
    ? analysis.categories.map((cat) => {
        const meta = getCategoryMeta(cat.id);
        return {
          id: cat.id,
          name: cat.name,
          icon: meta.icon,
          iconColor: meta.iconColor,
          recommended: cat.providers[0]?.name ?? 'Recommended',
        };
      })
    : categories.map((cat) => ({
        id: cat.id,
        name: cat.name,
        icon: cat.icon,
        iconColor: cat.iconColor,
        recommended: cat.recommended,
      }));

  const canSave = !!analysis;

  const handleSave = () => {
    if (!analysis) return;
    const stack = createStackFromAnalysis(query ?? '', analysis);
    if (stack) {
      toast.success(`"${stack.name}" added to your workspace`);
      router.push('/workspace');
    }
  };

  return (
    <div className="sticky top-24">
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="glass rounded-2xl p-6"
      >
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500/20 to-blue-500/20 ring-1 ring-violet-500/20">
            <Layers className="h-5 w-5 text-violet-300" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Recommended Stack</h3>
            <p className="text-xs text-muted-foreground">AI-curated for your project</p>
          </div>
        </div>

        <div className="mt-5 space-y-2">
          {items.map((cat, i) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.06 }}
              className="group flex items-center justify-between rounded-lg border border-foreground/5 bg-foreground/[0.02] px-3 py-2.5 transition-colors hover:border-violet-500/20 hover:bg-foreground/[0.04]"
            >
              <div className="flex items-center gap-2.5">
                <cat.icon className={`h-4 w-4 ${cat.iconColor}`} />
                <span className="text-xs text-muted-foreground">{cat.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-foreground">{cat.recommended}</span>
                <div className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500/15">
                  <Check className="h-2.5 w-2.5 text-emerald-400" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <button
          onClick={handleSave}
          disabled={!canSave}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-violet-500 to-blue-500 py-2.5 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Save This Stack
        </button>
      </motion.div>
    </div>
  );
}
