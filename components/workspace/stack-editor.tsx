'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  ChevronRight,
  Layers,
  Link2,
  Plus,
  Scale,
  Sparkles,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { getCategoryMeta } from '@/lib/categories';
import { useStack } from '@/lib/stack-context';
import { ProviderCard } from './provider-card';
import { ComparisonModal } from './comparison-modal';
import { Button } from '@/components/ui/button';

function CategoryHeader({
  categoryId,
  categoryName,
  count,
  collapsed,
  onToggle,
  onClear,
  onCompare,
}: {
  categoryId: string;
  categoryName: string;
  count: number;
  collapsed: boolean;
  onToggle: () => void;
  onClear: () => void;
  onCompare: () => void;
}) {
  const meta = getCategoryMeta(categoryId);
  return (
    <div className="flex items-center gap-3">
      <button
        onClick={onToggle}
        aria-label={collapsed ? 'Expand category' : 'Collapse category'}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-foreground/[0.04] hover:text-foreground"
      >
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${meta.gradient} ring-1 ring-foreground/10`}
      >
        <meta.icon className={`h-4.5 w-4.5 ${meta.iconColor}`} />
      </div>
      <div className="min-w-0 flex-1">
        <button onClick={onToggle} className="text-left">
          <h3 className="text-sm font-semibold text-foreground">{categoryName}</h3>
          <p className="text-[11px] text-muted-foreground">{count} providers</p>
        </button>
      </div>
      <div className="flex items-center gap-1.5">
        <Link
          href={`/category?id=${categoryId}&name=${encodeURIComponent(categoryName)}`}
          className="inline-flex items-center gap-1.5 rounded-lg border border-foreground/5 bg-foreground/[0.02] px-3 py-1.5 text-[11px] text-muted-foreground transition-all hover:border-violet-500/20 hover:text-foreground"
        >
          <Plus className="h-3 w-3" /> Add
        </Link>
        {count > 1 && (
          <Button
            variant="outline"
            size="sm"
            onClick={onCompare}
            className="h-7 gap-1.5 px-2.5 text-[11px] text-muted-foreground"
          >
            <Scale className="h-3 w-3" /> Compare
          </Button>
        )}
        {count > 0 && (
          <button
            onClick={onClear}
            aria-label="Clear category"
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-foreground/5 text-muted-foreground transition-colors hover:border-rose-500/30 hover:text-rose-300"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );
}

export function StackEditor() {
  const { activeStack, toggleCategory, clearCategory } = useStack();
  const [compareCategory, setCompareCategory] = useState<string | null>(null);

  if (!activeStack) return null;

  const hasCategories = activeStack.categories.length > 0;

  return (
    <div className="space-y-4">
      {hasCategories ? (
        <AnimatePresence mode="popLayout">
          {activeStack.categories.map((category) => {
            const count = category.providers.length;
            return (
              <motion.section
                key={category.categoryId}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.25 }}
                className="rounded-2xl glass p-5"
              >
                <CategoryHeader
                  categoryId={category.categoryId}
                  categoryName={category.categoryName}
                  count={count}
                  collapsed={category.collapsed}
                  onToggle={() => toggleCategory(category.categoryId)}
                  onClear={() => clearCategory(category.categoryId)}
                  onCompare={() => setCompareCategory(category.categoryId)}
                />

                <AnimatePresence initial={false}>
                  {!category.collapsed && (
                    <motion.div
                      key="body"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      {count > 0 ? (
                        <div className="mt-4 space-y-3">
                          {category.providers.map((provider, index) => (
                            <ProviderCard
                              key={provider.providerId}
                              provider={provider}
                              categoryId={category.categoryId}
                              categoryName={category.categoryName}
                              index={index}
                              total={count}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="mt-4 flex flex-col items-center justify-center rounded-xl border border-dashed border-foreground/10 py-10 text-center">
                          <Layers className="h-6 w-6 text-muted-foreground/40" />
                          <p className="mt-2 text-sm text-muted-foreground">
                            No providers in this category yet.
                          </p>
                          <Link
                            href={`/category?id=${category.categoryId}&name=${encodeURIComponent(category.categoryName)}`}
                            className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-violet-500 to-blue-500 px-4 py-2 text-xs font-medium text-white transition-opacity hover:opacity-90"
                          >
                            <Plus className="h-3.5 w-3.5" /> Browse providers
                          </Link>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.section>
            );
          })}
        </AnimatePresence>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl glass py-20 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/20 to-blue-500/20 ring-1 ring-violet-500/20">
            <Sparkles className="h-6 w-6 text-violet-300" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-foreground">Your stack is empty</h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Analyze a project to auto-build a stack, or browse categories and add providers manually.
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-violet-500 to-blue-500 px-4 py-2.5 text-xs font-medium text-white transition-opacity hover:opacity-90"
            >
              <Sparkles className="h-3.5 w-3.5" /> Analyze a project
            </Link>
            <Link
              href="/explore"
              className="inline-flex items-center gap-1.5 rounded-lg border border-foreground/5 bg-foreground/[0.02] px-4 py-2.5 text-xs text-muted-foreground transition-all hover:border-violet-500/20 hover:text-foreground"
            >
              <Link2 className="h-3.5 w-3.5" /> Browse categories
            </Link>
          </div>
        </div>
      )}

      <ComparisonModal
        open={compareCategory !== null}
        onOpenChange={(open) => {
          if (!open) setCompareCategory(null);
        }}
        presetCategoryId={compareCategory ?? undefined}
      />
    </div>
  );
}
