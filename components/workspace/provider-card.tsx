'use client';

import { motion } from 'framer-motion';
import {
  ArrowUp,
  ArrowDown,
  ExternalLink,
  Info,
  RefreshCw,
  Trash2,
  Check,
  Globe,
  BookOpen,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import type { StackProviderItem } from '@/lib/stacks/types';
import { pricingLabel } from '@/lib/stacks/comparison';
import { useStack } from '@/lib/stack-context';
import { ProviderLogo } from './logo';
import { ProviderDetail } from './provider-detail';
import { ReplaceProviderDialog } from './replace-provider';
import { Badge } from '@/components/ui/badge';

export function ProviderCard({
  provider,
  categoryId,
  categoryName,
  index,
  total,
  delay = 0,
}: {
  provider: StackProviderItem;
  categoryId: string;
  categoryName: string;
  index: number;
  total: number;
  delay?: number;
}) {
  const { moveProvider, removeProvider } = useStack();
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [replaceOpen, setReplaceOpen] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.25, delay }}
      className="cat-hover-glow group rounded-xl border border-foreground/5 bg-foreground/[0.02] p-4 transition-all hover:bg-foreground/[0.04]"
    >
      <div className="flex items-start gap-3">
        <ProviderLogo name={provider.name} className="h-11 w-11 rounded-lg text-base" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-sm font-semibold text-foreground">{provider.name}</h4>
            <Badge variant="outline" className="rounded-full px-2 py-0 text-[10px] font-normal text-muted-foreground">
              {pricingLabel(provider)}
            </Badge>
            {provider.openSource && (
              <Badge className="rounded-full bg-emerald-500/15 px-2 py-0 text-[10px] text-emerald-300 ring-1 ring-emerald-500/20">
                Open Source
              </Badge>
            )}
          </div>
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
            {provider.description}
          </p>
          {provider.reason && (
            <p className="cat-text-accent mt-1.5 text-[11px] leading-relaxed">
              <span className="cat-text-accent font-medium">Why:</span> {provider.reason}
            </p>
          )}
        </div>
        <div className="flex shrink-0 flex-col gap-1">
          <button
            onClick={() => moveProvider(categoryId, provider.providerId, -1)}
            disabled={index === 0}
            aria-label="Move up"
            className="flex h-7 w-7 items-center justify-center rounded-md border border-foreground/5 text-muted-foreground transition-colors hover:border-teal-500/25 hover:text-foreground disabled:opacity-30"
          >
            <ArrowUp className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => moveProvider(categoryId, provider.providerId, 1)}
            disabled={index === total - 1}
            aria-label="Move down"
            className="flex h-7 w-7 items-center justify-center rounded-md border border-foreground/5 text-muted-foreground transition-colors hover:border-teal-500/25 hover:text-foreground disabled:opacity-30"
          >
            <ArrowDown className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {provider.tags && provider.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {provider.tags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="rounded-md border border-foreground/5 bg-foreground/[0.03] px-2 py-0.5 text-[10px] text-muted-foreground"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {provider.website && (
          <a
            href={provider.website}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-lg border border-foreground/5 px-2.5 py-1.5 text-[11px] text-muted-foreground transition-all hover:border-teal-500/25 hover:text-foreground"
          >
            <Globe className="h-3 w-3" /> Website
          </a>
        )}
        {provider.documentation && (
          <a
            href={provider.documentation}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-lg border border-foreground/5 px-2.5 py-1.5 text-[11px] text-muted-foreground transition-all hover:border-teal-500/25 hover:text-foreground"
          >
            <BookOpen className="h-3 w-3" /> Docs
          </a>
        )}
        <button
          onClick={() => setDetailsOpen(true)}
          className="inline-flex items-center gap-1 rounded-lg border border-foreground/5 px-2.5 py-1.5 text-[11px] text-muted-foreground transition-all hover:border-teal-500/25 hover:text-foreground"
        >
          <Info className="h-3 w-3" /> Details
        </button>
        <button
          onClick={() => setReplaceOpen(true)}
          className="inline-flex items-center gap-1 rounded-lg border border-foreground/5 px-2.5 py-1.5 text-[11px] text-muted-foreground transition-all hover:border-teal-500/25 hover:text-foreground"
        >
          <RefreshCw className="h-3 w-3" /> Replace
        </button>
        <button
          onClick={() => removeProvider(categoryId, provider.providerId)}
          className="inline-flex items-center gap-1 rounded-lg border border-foreground/5 px-2.5 py-1.5 text-[11px] text-muted-foreground transition-all hover:border-rose-500/30 hover:text-rose-300"
        >
          <Trash2 className="h-3 w-3" /> Remove
        </button>
      </div>

      <ProviderDetail
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        provider={provider}
        categoryName={categoryName}
      />
      <ReplaceProviderDialog
        open={replaceOpen}
        onOpenChange={setReplaceOpen}
        categoryId={categoryId}
        categoryName={categoryName}
        current={provider}
      />
    </motion.div>
  );
}

export function InStackCheck({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-300 ring-1 ring-emerald-500/20">
      <Check className="h-3 w-3" /> In Stack
    </span>
  );
}

export function ProviderLinkIcon({ href, label }: { href?: string; label: string }) {
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-teal-300"
    >
      <ExternalLink className="h-3 w-3" /> {label}
    </a>
  );
}
