'use client';

import { BookOpen, Globe, Github, Sparkles, Tag } from 'lucide-react';
import type { StackProviderItem } from '@/lib/stacks/types';
import { pricingLabel } from '@/lib/stacks/comparison';
import { ProviderLogo } from './logo';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export function ProviderDetail({
  open,
  onOpenChange,
  provider,
  categoryName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  provider: StackProviderItem;
  categoryName: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <ProviderLogo name={provider.name} className="h-12 w-12 rounded-xl text-lg" />
            <div>
              <DialogTitle className="text-lg">{provider.name}</DialogTitle>
              <DialogDescription>
                {categoryName} · {pricingLabel(provider)}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="max-h-[55vh] space-y-5 overflow-y-auto pr-1">
          <p className="text-sm leading-relaxed text-muted-foreground">{provider.description}</p>

          {provider.reason && (
            <div className="rounded-xl border border-violet-500/20 bg-violet-500/[0.06] p-4">
              <p className="flex items-center gap-1.5 text-xs font-medium text-violet-300">
                <Sparkles className="h-3.5 w-3.5" /> Why this was selected
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{provider.reason}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-foreground/5 bg-foreground/[0.02] p-3">
              <p className="text-[11px] text-muted-foreground">Pricing Model</p>
              <p className="mt-0.5 text-sm font-medium capitalize text-foreground">
                {provider.pricingModel?.replace('-', ' ') ?? '—'}
              </p>
            </div>
            <div className="rounded-xl border border-foreground/5 bg-foreground/[0.02] p-3">
              <p className="text-[11px] text-muted-foreground">Free Tier</p>
              <p className="mt-0.5 text-sm font-medium text-foreground">
                {provider.freeTier ? 'Yes' : 'No'}
              </p>
            </div>
            <div className="rounded-xl border border-foreground/5 bg-foreground/[0.02] p-3">
              <p className="text-[11px] text-muted-foreground">Open Source</p>
              <p className="mt-0.5 text-sm font-medium text-foreground">
                {provider.openSource ? 'Yes' : 'No'}
              </p>
            </div>
            <div className="rounded-xl border border-foreground/5 bg-foreground/[0.02] p-3">
              <p className="text-[11px] text-muted-foreground">Popularity</p>
              <p className="mt-0.5 text-sm font-medium text-foreground">
                {typeof provider.popularityScore === 'number' ? `${provider.popularityScore}/100` : '—'}
              </p>
            </div>
          </div>

          <div>
            <p className="flex items-center gap-1.5 text-xs font-medium text-foreground">
              <Sparkles className="h-3.5 w-3.5 text-violet-400" /> Features
            </p>
            {provider.features && provider.features.length > 0 ? (
              <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
                {provider.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-violet-400" />
                    {feature}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-xs text-muted-foreground/50">Features coming soon</p>
            )}
          </div>

          <div>
            <p className="flex items-center gap-1.5 text-xs font-medium text-foreground">
              <Tag className="h-3.5 w-3.5 text-violet-400" /> Tags
            </p>
            {provider.tags && provider.tags.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {provider.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-md border border-foreground/5 bg-foreground/[0.03] px-2 py-1 text-[11px] text-muted-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-xs text-muted-foreground/50">Tags coming soon</p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {provider.website && (
              <a
                href={provider.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-foreground/5 px-3 py-2 text-xs text-muted-foreground transition-all hover:border-violet-500/20 hover:text-foreground"
              >
                <Globe className="h-3.5 w-3.5" /> Official Website
              </a>
            )}
            {provider.documentation && (
              <a
                href={provider.documentation}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-foreground/5 px-3 py-2 text-xs text-muted-foreground transition-all hover:border-violet-500/20 hover:text-foreground"
              >
                <BookOpen className="h-3.5 w-3.5" /> Documentation
              </a>
            )}
            {provider.github && (
              <a
                href={provider.github}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-foreground/5 px-3 py-2 text-xs text-muted-foreground transition-all hover:border-violet-500/20 hover:text-foreground"
              >
                <Github className="h-3.5 w-3.5" /> GitHub
              </a>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
