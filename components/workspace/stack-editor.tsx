'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  ChevronDown,
  ChevronRight,
  Check,
  Layers,
  Link2,
  Loader2,
  Plus,
  Scale,
  Sparkles,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { getCategoryMeta } from '@/lib/categories';
import { useStack } from '@/lib/stack-context';
import { ProviderCard } from './provider-card';
import { AddProviderDialog } from './add-provider-dialog';
import { ComparisonModal } from './comparison-modal';
import { Button } from '@/components/ui/button';

const ASSEMBLY_KEY = 'stack2set:assembly';

function CategoryHeader({
  categoryId,
  categoryName,
  count,
  collapsed,
  onToggle,
  onAdd,
  onClear,
  onCompare,
}: {
  categoryId: string;
  categoryName: string;
  count: number;
  collapsed: boolean;
  onToggle: () => void;
  onAdd: () => void;
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
        <button
          onClick={onAdd}
          className="inline-flex items-center gap-1.5 rounded-lg border border-teal-500/25 bg-teal-500/10 px-3 py-1.5 text-[11px] font-medium text-teal-300 transition-colors hover:bg-teal-500/15"
        >
          <Plus className="h-3 w-3" /> Add
        </button>
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

function AssemblyBanner({
  total,
  placed,
  ready,
  providerCount,
}: {
  total: number;
  placed: number;
  ready: boolean;
  providerCount: number;
}) {
  const progress = total ? Math.min(100, Math.round((Math.min(placed + 1, total) / total) * 100)) : 100;
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      role="status"
      aria-live="polite"
      className={`flex items-center gap-3 rounded-2xl border p-4 ${
        ready
          ? 'border-emerald-500/25 bg-emerald-500/[0.06]'
          : 'border-teal-500/25 bg-teal-500/[0.06]'
      }`}
    >
      {ready ? (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 ring-1 ring-emerald-500/30">
          <Check className="h-4 w-4 text-emerald-300" />
        </div>
      ) : (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-500/15 ring-1 ring-teal-500/25">
          <Loader2 className="h-4 w-4 animate-spin text-teal-300" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">
          {ready ? 'Your stack is ready' : 'Assembling your stack\u2026'}
        </p>
        <p className="text-[11px] text-muted-foreground">
          {ready
            ? `${total} categories \u00b7 ${providerCount} providers. Review each pick and customize freely.`
            : `Placing category ${Math.min(placed + 1, total)} of ${total}`}
        </p>
      </div>
      <div className="hidden h-1.5 w-28 overflow-hidden rounded-full bg-foreground/[0.06] sm:block">
        <motion.div
          className={`h-full ${ready ? 'bg-emerald-400' : 'bg-teal-400'}`}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
    </motion.div>
  );
}

export function StackEditor() {
  const { activeStack, toggleCategory, clearCategory } = useStack();
  const [compareCategory, setCompareCategory] = useState<string | null>(null);
  const [addCategoryId, setAddCategoryId] = useState<string | null>(null);
  const [assemble, setAssemble] = useState(false);
  const [placed, setPlaced] = useState(0);
  const [ready, setReady] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (sessionStorage.getItem(ASSEMBLY_KEY) === '1') {
      sessionStorage.removeItem(ASSEMBLY_KEY);
      setAssemble(true);
    }
  }, []);

  useEffect(() => {
    if (!activeStack) return;
    if (assemble && reduceMotion) {
      setPlaced(activeStack.categories.length);
    }
  }, [assemble, reduceMotion, activeStack]);

  useEffect(() => {
    if (!assemble || !activeStack) return;
    if (placed >= activeStack.categories.length && activeStack.categories.length > 0) {
      const t = setTimeout(() => setReady(true), 200);
      return () => clearTimeout(t);
    }
  }, [assemble, placed, activeStack]);

  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => setDismissed(true), 4000);
    return () => clearTimeout(t);
  }, [ready]);

  if (!activeStack) return null;

  const hasCategories = activeStack.categories.length > 0;
  const total = activeStack.categories.length;
  const providerCount = activeStack.categories.reduce((sum, c) => sum + c.providers.length, 0);
  const assembling = assemble && !dismissed && total > 0;

  return (
    <div className="space-y-4">
      {assembling && (
        <AssemblyBanner total={total} placed={placed} ready={ready} providerCount={providerCount} />
      )}

      {hasCategories ? (
        <AnimatePresence mode="popLayout">
          {activeStack.categories.map((category, index) => {
            const count = category.providers.length;
            return (
              <motion.section
                key={category.categoryId}
                layout
                initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{
                  duration: 0.35,
                  delay: assembling ? index * 0.18 : 0,
                }}
                onAnimationComplete={() => {
                  if (assemble) setPlaced((current) => Math.max(current, index + 1));
                }}
                className="rounded-2xl glass p-5"
              >
                <CategoryHeader
                  categoryId={category.categoryId}
                  categoryName={category.categoryName}
                  count={count}
                  collapsed={category.collapsed}
                  onToggle={() => toggleCategory(category.categoryId)}
                  onAdd={() => setAddCategoryId(category.categoryId)}
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
                          {category.providers.map((provider, providerIndex) => (
                            <ProviderCard
                              key={provider.providerId}
                              provider={provider}
                              categoryId={category.categoryId}
                              categoryName={category.categoryName}
                              index={providerIndex}
                              total={count}
                              delay={assembling ? providerIndex * 0.06 : 0}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="mt-4 flex flex-col items-center justify-center rounded-xl border border-dashed border-foreground/10 py-10 text-center">
                          <Layers className="h-6 w-6 text-muted-foreground/40" />
                          <p className="mt-2 text-sm text-muted-foreground">
                            No providers in this category yet.
                          </p>
                          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                            <button
                              onClick={() => setAddCategoryId(category.categoryId)}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-teal-500 px-4 py-2 text-xs font-medium text-white transition-opacity hover:opacity-90"
                            >
                              <Plus className="h-3.5 w-3.5" /> Add a provider
                            </button>
                            <Link
                              href={`/browse/providers?category=${encodeURIComponent(category.categoryId)}&addToStack=1`}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-foreground/10 px-4 py-2 text-xs text-muted-foreground transition-colors hover:border-teal-500/25 hover:text-foreground"
                            >
                              <Link2 className="h-3.5 w-3.5" /> Browse providers
                            </Link>
                          </div>
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
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500/20 to-cyan-500/20 ring-1 ring-teal-500/20">
            <Sparkles className="h-6 w-6 text-teal-300" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-foreground">Your stack is empty</h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Analyze a project to auto-build a stack, or browse categories and add providers manually.
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-lg bg-teal-500 px-4 py-2.5 text-xs font-medium text-white transition-opacity hover:opacity-90"
            >
              <Sparkles className="h-3.5 w-3.5" /> Analyze a project
            </Link>
            <Link
              href="/explore"
              className="inline-flex items-center gap-1.5 rounded-lg border border-foreground/5 bg-foreground/[0.02] px-4 py-2.5 text-xs text-muted-foreground transition-all hover:border-teal-500/25 hover:text-foreground"
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
      {addCategoryId && (
        <AddProviderDialog
          open={addCategoryId !== null}
          onOpenChange={(open) => {
            if (!open) setAddCategoryId(null);
          }}
          categoryId={addCategoryId}
          categoryName={
            activeStack.categories.find((c) => c.categoryId === addCategoryId)?.categoryName ?? ''
          }
        />
      )}
    </div>
  );
}
