import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  BookOpen,
  DollarSign,
  ExternalLink,
  Github,
  Layers,
  ShieldCheck,
  Sparkles,
  Star,
  Tag,
} from 'lucide-react';
import { providerService } from '@/lib/services/provider-service';
import type { ProviderWithRelations } from '@/lib/db/schema';
import { isProviderFree, providerCostLabel } from '@/lib/stacks/health';
import { categoryIcon } from '@/lib/browse/category-icons';
import { WorkspaceShell } from '@/components/workspace/workspace-shell';
import { compareBadge, badgeIcon } from '@/lib/stacks/badge';
import { FavoriteButton } from '@/components/browse/favorite-button';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const provider = await providerService.getProviderBySlug(slug);
  if (!provider) return { title: 'Provider not found' };
  return {
    title: `${provider.name} · Provider`,
    description: provider.shortDescription,
  };
}

function StatCell({ label, value }: { label: string; value?: number }) {
  if (typeof value !== 'number') {
    return (
      <div className="rounded-xl border border-foreground/5 bg-foreground/[0.02] p-3">
        <p className="text-[11px] text-muted-foreground">{label}</p>
        <p className="mt-0.5 text-sm font-medium text-muted-foreground/50">—</p>
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-foreground/5 bg-foreground/[0.02] p-3">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <div className="mt-1.5 flex items-center gap-2">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-foreground/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-blue-500"
            style={{ width: `${(value / 5) * 100}%` }}
          />
        </div>
        <span className="shrink-0 text-xs font-medium tabular-nums text-foreground">
          {value}/5
        </span>
      </div>
    </div>
  );
}

function CriterionGrid({
  title,
  icon,
  values,
  emptyText,
}: {
  title: string;
  icon: React.ReactNode;
  values: string[];
  emptyText?: string;
}) {
  const safeValues = values ?? [];
  if (safeValues.length === 0 && !emptyText) return null;
  return (
    <div className="rounded-2xl glass p-5">
      <p className="flex items-center gap-1.5 text-sm font-medium text-foreground">
        {icon}
        {title}
      </p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {safeValues.length === 0 ? (
          <span className="text-xs text-muted-foreground/50">{emptyText ?? '—'}</span>
        ) : (
          safeValues.map((value) => (
            <span
              key={value}
              className="rounded-md border border-foreground/5 bg-foreground/[0.03] px-2 py-1 text-[11px] text-muted-foreground"
            >
              {value}
            </span>
          ))
        )}
      </div>
    </div>
  );
}

function FactsGrid({ provider }: { provider: ProviderWithRelations }) {
  const rating = provider.stack2SetRating ?? provider.communityRating;
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="rounded-xl border border-foreground/5 bg-foreground/[0.02] p-3">
        <p className="text-[11px] text-muted-foreground">Pricing model</p>
        <p className="mt-0.5 text-sm font-medium capitalize text-foreground">
          {provider.pricingModel?.replace('-', ' ')}
        </p>
      </div>
      <div className="rounded-xl border border-foreground/5 bg-foreground/[0.02] p-3">
        <p className="text-[11px] text-muted-foreground">Free tier</p>
        <p className="mt-0.5 text-sm font-medium text-foreground">{provider.freeTier ? 'Yes' : 'No'}</p>
      </div>
      <div className="rounded-xl border border-foreground/5 bg-foreground/[0.02] p-3">
        <p className="text-[11px] text-muted-foreground">Open source</p>
        <p className="mt-0.5 text-sm font-medium text-foreground">{provider.openSource ? 'Yes' : 'No'}</p>
      </div>
      <div className="rounded-xl border border-foreground/5 bg-foreground/[0.02] p-3">
        <p className="text-[11px] text-muted-foreground">Popularity</p>
        <p className="mt-0.5 text-sm font-medium text-foreground">{provider.popularityScore ?? 0}/100</p>
      </div>
      {typeof rating === 'number' && (
        <div className="rounded-xl border border-foreground/5 bg-foreground/[0.02] p-3">
          <p className="text-[11px] text-muted-foreground">Stack2Set rating</p>
          <p className="mt-0.5 flex items-center gap-1 text-sm font-medium text-amber-300">
            <Star className="h-3.5 w-3.5 fill-current" /> {rating.toFixed(1)}
          </p>
        </div>
      )}
      <div className="rounded-xl border border-foreground/5 bg-foreground/[0.02] p-3">
        <p className="text-[11px] text-muted-foreground">Est. monthly cost</p>
        <p className="mt-0.5 text-sm font-medium text-foreground">{providerCostLabel(provider)}</p>
      </div>
      {provider.enterprisePricing && (
        <div className="col-span-2 rounded-xl border border-foreground/5 bg-foreground/[0.02] p-3">
          <p className="text-[11px] text-muted-foreground">Enterprise pricing</p>
          <p className="mt-0.5 text-sm font-medium text-foreground">{provider.enterprisePricing}</p>
        </div>
      )}
    </div>
  );
}

export default async function ProviderDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const provider = await providerService.getProviderBySlug(slug);
  if (!provider) notFound();

  const categoryId = provider.categoryId;
  const [category, alternatives, categoryProviders] = await Promise.all([
    categoryId ? providerService.getCategoryBySlug(categoryId) : Promise.resolve(null),
    providerService.getAlternatives(slug),
    categoryId ? providerService.getProvidersByCategory(categoryId) : Promise.resolve([]),
  ]);

  const Icon = categoryIcon(category?.icon);
  const group = categoryProviders.length > 1 ? categoryProviders : [provider];
  const badge = compareBadge(provider, group);
  const BadgeIcon = badge ? badgeIcon(badge) : null;
  const sourceIsFallback = provider.aiSuggested;

  return (
    <WorkspaceShell>
      <div className="space-y-6">
        <Link
          href="/browse/providers"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to providers
        </Link>

        <div className="rounded-2xl glass p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/20 to-blue-500/20 ring-1 ring-foreground/10">
              <span className="text-xl font-semibold text-violet-300">{provider.name.charAt(0)}</span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                  {provider.name}
                </h1>
                {badge && BadgeIcon && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-1 text-[10px] font-medium text-amber-300">
                    <BadgeIcon className="h-3 w-3" /> {badge}
                  </span>
                )}
                {sourceIsFallback && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-fuchsia-500/10 px-2 py-1 text-[10px] font-medium text-fuchsia-300">
                    <Sparkles className="h-3 w-3" /> AI suggested
                  </span>
                )}
              </div>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                <Icon className="h-3.5 w-3.5" />
                {category?.name ?? 'Provider'}
              </p>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                {provider.longDescription || provider.shortDescription}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <FavoriteButton slug={slug} categoryId={provider.categoryId} showLabel />
                {provider.officialWebsite && (
                  <a
                    href={provider.officialWebsite}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-violet-500 to-blue-500 px-3 py-2 text-xs font-medium text-white transition-opacity hover:opacity-90"
                  >
                    <ExternalLink className="h-3.5 w-3.5" /> Website
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
          </div>
        </div>

        {provider.aiSummary && (
          <div className="rounded-2xl border border-violet-500/20 bg-violet-500/[0.06] p-5">
            <p className="flex items-center gap-1.5 text-xs font-medium text-violet-300">
              <Sparkles className="h-3.5 w-3.5" /> AI summary
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{provider.aiSummary}</p>
          </div>
        )}

        <div>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-medium text-foreground">
            <DollarSign className="h-4 w-4 text-violet-400" /> Pricing &amp; rating
          </h2>
          <FactsGrid provider={provider} />
        </div>

        <div>
          <h2 className="mb-3 text-sm font-medium text-foreground">Performance</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCell label="Learning curve" value={provider.learningCurve} />
            <StatCell label="Speed" value={provider.speed} />
            <StatCell label="Scalability" value={provider.scalability} />
            <StatCell label="Reliability" value={provider.reliability} />
          </div>
          {provider.security && (
            <p className="mt-3 flex items-center gap-1.5 text-xs text-emerald-300">
              <ShieldCheck className="h-3.5 w-3.5" /> Security review passed
            </p>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <CriterionGrid
            title="Features"
            icon={<Sparkles className="h-3.5 w-3.5 text-violet-400" />}
            values={provider.features ?? []}
            emptyText="Features coming soon"
          />
          <CriterionGrid
            title="Integrations"
            icon={<Layers className="h-3.5 w-3.5 text-violet-400" />}
            values={provider.integrations ?? []}
          />
          <CriterionGrid
            title="APIs"
            icon={<BookOpen className="h-3.5 w-3.5 text-violet-400" />}
            values={provider.apis ?? []}
          />
          <CriterionGrid
            title="SDKs"
            icon={<Layers className="h-3.5 w-3.5 text-violet-400" />}
            values={provider.sdks ?? []}
          />
          <CriterionGrid
            title="AI features"
            icon={<Sparkles className="h-3.5 w-3.5 text-violet-400" />}
            values={provider.aiFeatures ?? []}
          />
          <CriterionGrid
            title="Languages"
            icon={<Layers className="h-3.5 w-3.5 text-violet-400" />}
            values={provider.languages ?? []}
          />
          {provider.compatibility && Object.keys(provider.compatibility).length > 0 && (
            <CriterionGrid
              title="Compatibility"
              icon={<Layers className="h-3.5 w-3.5 text-violet-400" />}
              values={Object.entries(provider.compatibility)
                .filter(([, value]) => value)
                .map(([key]) => key)}
            />
          )}
          {provider.compliance && provider.compliance.length > 0 && (
            <CriterionGrid
              title="Compliance"
              icon={<ShieldCheck className="h-3.5 w-3.5 text-violet-400" />}
              values={provider.compliance}
            />
          )}
          <CriterionGrid
            title="Tags"
            icon={<Tag className="h-3.5 w-3.5 text-violet-400" />}
            values={provider.tags ?? []}
            emptyText="Tags coming soon"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <CriterionGrid
            title="Pros"
            icon={<Star className="h-3.5 w-3.5 text-emerald-400" />}
            values={provider.pros ?? []}
          />
          <CriterionGrid
            title="Cons"
            icon={<Star className="h-3.5 w-3.5 text-rose-400" />}
            values={provider.cons ?? []}
          />
          <CriterionGrid
            title="Best use cases"
            icon={<Sparkles className="h-3.5 w-3.5 text-amber-400" />}
            values={provider.bestUseCases ?? []}
          />
        </div>

        {alternatives.length > 0 && (
          <div className="rounded-2xl glass p-5">
            <h2 className="mb-3 text-sm font-medium text-foreground">Alternatives</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {alternatives.map((alt) => (
                <Link
                  key={alt.slug}
                  href={`/browse/providers/${alt.slug}`}
                  className="group rounded-xl border border-foreground/5 bg-foreground/[0.02] p-4 transition-colors hover:border-violet-500/20"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500/20 to-blue-500/20 ring-1 ring-foreground/10">
                      <span className="text-xs font-semibold text-violet-300">{alt.name.charAt(0)}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground group-hover:text-violet-300">
                        {alt.name}
                      </p>
                      <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Star className="h-2.5 w-2.5 text-amber-300" />
                        {alt.popularityScore}/100 popularity
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {provider.source === 'seed' && provider.lastSyncedAt && (
          <p className="text-center text-[11px] text-muted-foreground/60">
            Data last synced {provider.lastSyncedAt}. Runs update automatically.
          </p>
        )}
      </div>
    </WorkspaceShell>
  );
}
