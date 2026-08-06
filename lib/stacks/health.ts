import type { Complexity } from '@/lib/types';
import type { StackHealth, StackProviderItem, UserStack } from './types';

const MONTHLY_COST_BY_MODEL: Record<string, number> = {
  free: 0,
  'open-source': 0,
  freemium: 20,
  subscription: 30,
  'usage-based': 50,
  'per-seat': 15,
};

export function pricingModelMonthlyCost(model?: string): number {
  if (!model) return 0;
  return MONTHLY_COST_BY_MODEL[model] ?? 0;
}

export function complexityDifficulty(complexity?: Complexity): string {
  return complexity ?? 'Medium';
}

export function formatCurrency(value: number): string {
  return `$${Math.round(value).toLocaleString('en-US')}`;
}

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function computeStackHealth(stack: UserStack): StackHealth {
  const entries = stack.categories.filter((c) => c.providers.length > 0);
  const providers = entries.flatMap((c) => c.providers);

  if (providers.length === 0) {
    return {
      compatibility: 0,
      complexity: 50,
      estimatedLearningCurve: 50,
      estimatedMonthlyCost: 0,
      scalability: 0,
      maintainability: 0,
      aiConfidence: 0,
    };
  }

  const avgPopularity =
    providers.reduce((sum, p) => sum + (p.popularityScore ?? 50), 0) / providers.length;
  const openSourceCount = providers.filter((p) => p.openSource).length;
  const freeTierCount = providers.filter((p) => p.freeTier || p.pricingModel === 'free').length;
  const openSourceRatio = openSourceCount / providers.length;
  const freeTierRatio = freeTierCount / providers.length;
  const documented = providers.filter((p) => p.documentation || p.website).length / providers.length;

  const estimatedMonthlyCost = entries.reduce((sum, entry) => {
    if (entry.providers.length === 0) return sum;
    const cheapest = Math.min(...entry.providers.map((p) => pricingModelMonthlyCost(p.pricingModel)));
    return sum + cheapest;
  }, 0);

  const complexityBase = (() => {
    switch (stack.sourceAnalysis?.complexity) {
      case 'Low':
        return 25;
      case 'High':
        return 75;
      default:
        return 50;
    }
  })();

  return {
    compatibility: clamp(85 + openSourceRatio * 10 + (freeTierRatio > 0.5 ? 5 : 0)),
    complexity: clamp(complexityBase + entries.length * 3),
    estimatedLearningCurve: clamp(avgPopularity),
    estimatedMonthlyCost,
    scalability: clamp(avgPopularity * 0.6 + openSourceRatio * 25 + freeTierRatio * 15),
    maintainability: clamp(avgPopularity * 0.45 + openSourceRatio * 35 + documented * 20),
    aiConfidence: clamp(
      92 - (providers.filter((p) => !p.reason && !p.features?.length).length / providers.length) * 30,
    ),
  };
}

export function stackCategoryCount(stack: UserStack): number {
  return stack.categories.filter((c) => c.providers.length > 0).length;
}

export function stackProviderCount(stack: UserStack): number {
  return stack.categories.reduce((sum, c) => sum + c.providers.length, 0);
}

export function providerNameList(providers: StackProviderItem[]): string {
  return providers.map((p) => p.name).join(', ');
}
