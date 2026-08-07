import type { SharePayload } from '@/lib/stacks/types';
import { formatCurrency } from '@/lib/stacks/health';
import { pricingLabel } from '@/lib/stacks/comparison';
import { getCategoryMeta } from '@/lib/categories';
import { ProviderLogo } from '@/components/workspace/logo';
import { ShareActions } from '@/components/workspace/share-actions';
import { siteConfig, absoluteUrl } from '@/lib/site';
import Link from 'next/link';

function ShareProvider({
  provider,
  categoryName,
}: {
  provider: SharePayload['categories'][number]['providers'][number];
  categoryName: string;
}) {
  return (
    <div className="rounded-xl border border-foreground/5 bg-foreground/[0.02] p-4">
      <div className="flex items-start gap-3">
        <ProviderLogo name={provider.name} className="h-11 w-11 rounded-lg text-base" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground">{provider.name}</h3>
            <span className="rounded-full border border-foreground/5 bg-foreground/[0.03] px-2 py-0 text-[10px] text-muted-foreground">
              {categoryName}
            </span>
            <span className="rounded-full border border-foreground/5 bg-foreground/[0.03] px-2 py-0 text-[10px] text-muted-foreground">
              {pricingLabel(provider)}
            </span>
          </div>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            {provider.description}
          </p>
          {provider.reason && (
            <p className="mt-1.5 text-xs leading-relaxed text-violet-300/80">
              <span className="font-medium text-violet-300">Why:</span> {provider.reason}
            </p>
          )}
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
            className="rounded-lg border border-foreground/5 px-2.5 py-1.5 text-[11px] text-muted-foreground transition-all hover:border-violet-500/20 hover:text-foreground"
          >
            Website
          </a>
        )}
        {provider.documentation && (
          <a
            href={provider.documentation}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-foreground/5 px-2.5 py-1.5 text-[11px] text-muted-foreground transition-all hover:border-violet-500/20 hover:text-foreground"
          >
            Documentation
          </a>
        )}
      </div>
    </div>
  );
}

export function ShareView({
  share,
  id,
}: {
  share: SharePayload;
  id: string;
}) {
  const url = absoluteUrl(`/stack/${id}`);
  const providerCount = share.categories.reduce((sum, c) => sum + c.providers.length, 0);
  const nonEmptyCategories = share.categories.filter((c) => c.providers.length > 0);

  const healthBars = [
    { label: 'Compatibility', value: share.health.compatibility },
    { label: 'Learning Curve', value: share.health.estimatedLearningCurve },
    { label: 'Scalability', value: share.health.scalability },
    { label: 'Maintainability', value: share.health.maintainability },
  ];

  return (
    <main className="relative min-h-screen overflow-x-hidden pt-20">
      <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[400px] w-[700px] -translate-x-1/2 rounded-full bg-violet-600/10 blur-[120px]" />

      <div className="mx-auto max-w-4xl px-6 py-8">
        <header>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Built with {siteConfig.name}
              </Link>
              <h1 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                {share.name}
              </h1>
              {share.prompt && (
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                  {share.prompt}
                </p>
              )}
              <p className="mt-3 text-sm text-muted-foreground">
                {nonEmptyCategories.length} categories · {providerCount} providers
                {share.complexity && ` · ${share.complexity} complexity`}
              </p>
            </div>
            <div className="shrink-0">
              <ShareActions url={url} title={share.name} prompt={share.prompt} />
            </div>
          </div>
        </header>

        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          <div className="rounded-2xl glass p-5">
            <p className="text-xs text-muted-foreground">Difficulty</p>
            <p className="mt-1 text-2xl font-semibold text-foreground">{share.difficulty}</p>
          </div>
          <div className="rounded-2xl glass p-5">
            <p className="text-xs text-muted-foreground">Est. Monthly Cost</p>
            <p className="mt-1 text-2xl font-semibold text-foreground">
              {formatCurrency(share.estimatedMonthlyCost)}
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-3 rounded-2xl glass p-5">
          <p className="text-sm font-semibold text-foreground">Stack Health</p>
          {healthBars.map((bar) => (
            <div key={bar.label} className="flex items-center gap-3">
              <span className="w-32 shrink-0 text-xs text-muted-foreground">{bar.label}</span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-foreground/5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-500 to-blue-500"
                  style={{ width: `${bar.value}%` }}
                />
              </div>
              <span className="w-10 shrink-0 text-right text-xs font-medium text-foreground">
                {bar.value}%
              </span>
            </div>
          ))}
        </div>

        <div className="mt-8 space-y-6">
          {nonEmptyCategories.map((category) => {
            const meta = getCategoryMeta(category.categoryId);
            return (
              <section key={category.categoryId} className="rounded-2xl glass p-5">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${meta.gradient} ring-1 ring-foreground/10`}
                  >
                    <meta.icon className={`h-4.5 w-4.5 ${meta.iconColor}`} />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-foreground">{category.categoryName}</h2>
                    <p className="text-[11px] text-muted-foreground">
                      {category.providers.length} provider{category.providers.length === 1 ? '' : 's'}
                    </p>
                  </div>
                </div>
                <div className="mt-4 space-y-3">
                  {category.providers.map((provider) => (
                    <ShareProvider
                      key={provider.providerId}
                      provider={provider}
                      categoryName={category.categoryName}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        <footer className="mt-12 border-t border-foreground/5 pt-6 text-center">
          <p className="text-xs text-muted-foreground">
            Want to build and share your own stack?{' '}
            <Link href="/" className="text-violet-400 transition-colors hover:text-violet-300">
              Try {siteConfig.name}
            </Link>
          </p>
        </footer>
      </div>
    </main>
  );
}
