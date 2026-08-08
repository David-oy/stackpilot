'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Check,
  Loader2,
  Plus,
  Search,
  Sparkles,
} from 'lucide-react';
import { useStack } from '@/lib/stack-context';
import { getCategoryMeta, categoryCssVars } from '@/lib/categories';
import type { ProviderSuggestion } from '@/lib/gemini';
import {
  isProviderInCategory,
  normalizeWebsite,
  persistProviderToCatalog,
  splitTags,
} from '@/lib/stacks/add-provider';
import { slugify } from '@/lib/db/seed/helpers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type Mode = 'menu' | 'ai' | 'manual';

export function AddProviderDialog({
  open,
  onOpenChange,
  categoryId,
  categoryName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryId: string;
  categoryName: string;
}) {
  const { activeStack, addProvider } = useStack();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('menu');
  const [submitting, setSubmitting] = useState<string | null>(null);

  useEffect(() => {
    if (open) setMode('menu');
  }, [open]);

  const stack = activeStack;
  const prompt = stack?.prompt ?? '';
  const existing = useMemo(() => {
    const category = stack?.categories.find((c) => c.categoryId === categoryId);
    return category?.providers.map((p) => p.name) ?? [];
  }, [stack, categoryId]);

  const addToStack = (
    name: string,
    data: {
      description: string;
      reason?: string;
      website?: string;
      documentation?: string;
      tags?: string[];
      aiSuggested?: boolean;
    },
  ) => {
    if (isProviderInCategory(stack, categoryId, name, data.website)) {
      toast.info(`${name} is already in ${categoryName}`);
      return;
    }
    addProvider(categoryId, categoryName, {
      providerId: `${slugify(name)}-${Math.random().toString(36).slice(2, 7)}`,
      name,
      description: data.description,
      reason: data.reason,
      website: data.website || undefined,
      documentation: data.documentation || undefined,
      tags: data.tags ?? [],
      aiSuggested: data.aiSuggested,
    });
    toast.success(`${name} added to ${categoryName}`);
    onOpenChange(false);
  };

  const handleBrowse = () => {
    onOpenChange(false);
    router.push(`/browse/providers?category=${encodeURIComponent(categoryId)}&addToStack=1`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        style={categoryCssVars(getCategoryMeta(categoryId).color)}
        className="sm:max-w-md"
      >
        <DialogHeader>
          <DialogTitle>
            {mode === 'menu' && 'How would you like to add?'}
            {mode === 'ai' && `Suggest providers for ${categoryName}`}
            {mode === 'manual' && `Add a provider to ${categoryName}`}
          </DialogTitle>
          <DialogDescription>
            {mode === 'menu'
              ? `Add a provider to ${categoryName}`
              : mode === 'ai'
                ? 'Gemini considers your project and the providers already in this category.'
                : 'Add a provider you already know and use.'}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-1">
          {mode === 'menu' && (
            <MenuOptions
              onSuggest={() => setMode('ai')}
              onBrowse={handleBrowse}
              onManual={() => setMode('manual')}
            />
          )}

          {mode === 'ai' && (
            <AiSuggestions
              categoryId={categoryId}
              categoryName={categoryName}
              prompt={prompt}
              existing={existing}
              onAdd={addToStack}
              onBack={() => setMode('menu')}
              submitting={submitting}
              setSubmitting={setSubmitting}
            />
          )}

          {mode === 'manual' && (
            <ManualForm
              categoryId={categoryId}
              categoryName={categoryName}
              onAdd={addToStack}
              onBack={() => setMode('menu')}
              submitting={submitting}
              setSubmitting={setSubmitting}
            />
          )}
        </div>

        <div className="flex items-center justify-between">
          {mode === 'menu' ? (
            <p className="text-[11px] text-muted-foreground">
              {categoryName} currently has {existing.length}{' '}
              {existing.length === 1 ? 'provider' : 'providers'}.
            </p>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMode('menu')}
              disabled={submitting !== null}
              className="h-8 gap-1.5 text-xs"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function MenuOptions({
  onSuggest,
  onBrowse,
  onManual,
}: {
  onSuggest: () => void;
  onBrowse: () => void;
  onManual: () => void;
}) {
  return (
    <div className="space-y-2.5">
      <OptionButton
        icon={<Sparkles className="cat-text-accent h-4 w-4" />}
        title="Suggest with AI"
        description="Let Gemini find providers suitable for this category and project."
        onClick={onSuggest}
      />
      <OptionButton
        icon={<Search className="cat-text-accent h-4 w-4" />}
        title="Browse providers"
        description="Browse existing providers in this category."
        onClick={onBrowse}
      />
      <OptionButton
        icon={<Plus className="cat-text-accent h-4 w-4" />}
        title="Add a provider"
        description="I already know the provider I want."
        onClick={onManual}
      />
    </div>
  );
}

function OptionButton({
  icon,
  title,
  description,
  onClick,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="cat-hover-glow group flex w-full items-start gap-3 rounded-xl border border-foreground/5 bg-foreground/[0.02] p-3.5 text-left transition-all hover:bg-foreground/[0.04]"
    >
      <div className="cat-icon-box cat-glow-sm flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1 ring-foreground/10">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="cat-text-accent text-sm font-semibold text-foreground transition-colors">
          {title}
        </p>
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{description}</p>
      </div>
    </button>
  );
}

function AiSuggestions({
  categoryId,
  categoryName,
  prompt,
  existing,
  onAdd,
  onBack,
  submitting,
  setSubmitting,
}: {
  categoryId: string;
  categoryName: string;
  prompt: string;
  existing: string[];
  onAdd: (
    name: string,
    data: {
      description: string;
      reason?: string;
      website?: string;
      tags?: string[];
      aiSuggested?: boolean;
    },
  ) => void;
  onBack: () => void;
  submitting: string | null;
  setSubmitting: (value: string | null) => void;
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<ProviderSuggestion[]>([]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/providers/suggest?category=${encodeURIComponent(categoryName)}&project=${encodeURIComponent(prompt)}&existing=${encodeURIComponent(existing.join(','))}`,
      );
      const data = (await res.json()) as { suggestions?: ProviderSuggestion[]; error?: string };
      if (!res.ok) throw new Error(data?.error ?? 'Failed to generate suggestions.');
      setSuggestions((data?.suggestions ?? []).slice(0, 4));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate suggestions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAdd = async (suggestion: ProviderSuggestion) => {
    if (submitting) return;
    setSubmitting(suggestion.name);
    const persist = await persistProviderToCatalog({
      categoryId,
      name: suggestion.name,
      description: suggestion.description,
      website: suggestion.website,
      tags: suggestion.tags,
      reason: suggestion.reason,
      aiSuggested: true,
    });
    if (persist.error) {
      toast.warning(`${persist.error} Added to your stack locally.`);
    }
    onAdd(suggestion.name, {
      description: suggestion.description,
      reason: suggestion.reason,
      website: suggestion.website,
      tags: suggestion.tags,
      aiSuggested: true,
    });
    setSubmitting(null);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-foreground/5 bg-foreground/[0.02] py-10">
        <Loader2 className="h-6 w-6 animate-spin text-teal-400" />
        <p className="text-xs text-muted-foreground">
          Gemini is matching providers to your project…
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-rose-500/20 bg-rose-500/[0.05] px-4 py-8 text-center">
        <p className="text-xs leading-relaxed text-muted-foreground">{error}</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onBack} className="h-8 text-xs">
            Back
          </Button>
          <Button size="sm" onClick={() => void load()} className="h-8 gap-1.5 text-xs">
            <Loader2 className="h-3.5 w-3.5" /> Try again
          </Button>
        </div>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-foreground/5 bg-foreground/[0.02] px-4 py-8 text-center">
        <p className="text-xs text-muted-foreground">No new suggestions right now.</p>
        <Button variant="outline" size="sm" onClick={onBack} className="h-8 text-xs">
          Back
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      <p className="flex items-center gap-1.5 text-xs font-medium text-foreground">
        <Sparkles className="cat-text-accent h-3.5 w-3.5" /> Suggested for {categoryName}
      </p>
      {suggestions.map((suggestion) => {
        const busy = submitting === suggestion.name;
        return (
          <div
            key={suggestion.name}
            className="cat-hover-glow rounded-xl border border-foreground/5 bg-foreground/[0.02] p-3.5 transition-all hover:bg-foreground/[0.04]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">{suggestion.name}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                  {suggestion.description}
                </p>
                {suggestion.reason && (
                  <p className="cat-text-accent mt-1.5 text-[11px] leading-relaxed">
                    <span className="cat-text-accent font-medium">Why it fits:</span>{' '}
                    {suggestion.reason}
                  </p>
                )}
                {suggestion.tags && suggestion.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {suggestion.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-md border border-foreground/5 bg-foreground/[0.03] px-2 py-0.5 text-[10px] text-muted-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <Button
                size="sm"
                onClick={() => void handleAdd(suggestion)}
                disabled={submitting !== null}
                className="h-8 shrink-0 gap-1.5 bg-teal-500 text-xs text-white hover:bg-teal-600"
              >
                {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                Add
              </Button>
            </div>
          </div>
        );
      })}
      <p className="text-[11px] leading-relaxed text-muted-foreground">
        Suggestions are saved to the shared provider catalog when added. You can add more than
        one.
      </p>
    </div>
  );
}

function ManualForm({
  categoryId,
  categoryName,
  onAdd,
  onBack,
  submitting,
  setSubmitting,
}: {
  categoryId: string;
  categoryName: string;
  onAdd: (
    name: string,
    data: {
      description: string;
      reason?: string;
      website?: string;
      documentation?: string;
      tags?: string[];
      aiSuggested?: boolean;
    },
  ) => void;
  onBack: () => void;
  submitting: string | null;
  setSubmitting: (value: string | null) => void;
}) {
  const { activeStack } = useStack();
  const [name, setName] = useState('');
  const [website, setWebsite] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const clearErrors = () => setErrors({});

  const handleSubmit = async () => {
    const next: Record<string, string> = {};
    const cleanName = name.trim();
    if (!cleanName) next.name = 'Provider name is required.';

    const websiteUrl = normalizeWebsite(website);
    if (website.trim() && !websiteUrl) next.website = 'Enter a valid URL (e.g. upstash.com).';

    if (cleanName && isProviderInCategory(activeStack, categoryId, cleanName, websiteUrl ?? undefined)) {
      next.name = `${cleanName} is already in ${categoryName}.`;
    }

    if (Object.keys(next).length > 0) {
      setErrors(next);
      return;
    }

    setSubmitting('manual');
    const persist = await persistProviderToCatalog({
      categoryId,
      name: cleanName,
      description: description.trim(),
      website: websiteUrl ?? undefined,
      tags: splitTags(tags),
      aiSuggested: false,
    });
    if (persist.error) {
      toast.warning(`${persist.error} Added to your stack locally.`);
    } else if (persist.duplicate) {
      toast.info(`${cleanName} already existed in the catalog — added to your stack.`);
    }
    onAdd(cleanName, {
      description: description.trim(),
      website: websiteUrl ?? undefined,
      tags: splitTags(tags),
    });
    setSubmitting(null);
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void handleSubmit();
      }}
      className="space-y-3"
    >
      <div>
        <Label htmlFor="manual-name" className="text-xs text-muted-foreground">
          Provider name *
        </Label>
        <Input
          id="manual-name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            clearErrors();
          }}
          placeholder="e.g. Upstash"
          aria-invalid={Boolean(errors.name)}
          className="mt-1 h-9"
        />
        {errors.name && <p className="mt-1 text-[11px] text-rose-300">{errors.name}</p>}
      </div>

      <div>
        <Label htmlFor="manual-website" className="text-xs text-muted-foreground">
          Website
        </Label>
        <Input
          id="manual-website"
          type="text"
          value={website}
          onChange={(e) => {
            setWebsite(e.target.value);
            clearErrors();
          }}
          placeholder="upstash.com"
          aria-invalid={Boolean(errors.website)}
          className="mt-1 h-9"
        />
        {errors.website && <p className="mt-1 text-[11px] text-rose-300">{errors.website}</p>}
      </div>

      <div>
        <Label htmlFor="manual-description" className="text-xs text-muted-foreground">
          Description
        </Label>
        <Textarea
          id="manual-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Short description of this provider or service."
          rows={2}
          className="mt-1 resize-none text-sm"
        />
      </div>

      <div>
        <Label htmlFor="manual-tags" className="text-xs text-muted-foreground">
          Tags (comma separated)
        </Label>
        <Input
          id="manual-tags"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="serverless, redis, cache"
          className="mt-1 h-9"
        />
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
        <Button type="button" variant="ghost" size="sm" onClick={onBack} className="h-9 text-xs">
          Back
        </Button>
        <Button
          type="submit"
          size="sm"
          disabled={submitting !== null || !name.trim()}
          className="h-9 gap-1.5 bg-teal-500 text-xs text-white hover:bg-teal-600"
        >
          {submitting === 'manual' ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Check className="h-3.5 w-3.5" />
          )}
          Add to stack
        </Button>
      </div>
    </form>
  );
}
