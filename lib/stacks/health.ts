import type { Complexity } from '@/lib/types';
import type { StackHealth, StackProviderItem, UserStack } from './types';

const MONTHLY_COST_BY_MODEL: Record<string, number> = {
  free: 0,
  'open-source': 0,
  freemium: 20,
  subscription: 30,
  'usage-based': 50,
  'per-seat': 15,
  paid: 30,
};

function normalizePricingModel(model?: string): string {
  if (!model) return '';
  return model.trim().toLowerCase().replace(/\s+/g, '-');
}

export function pricingModelMonthlyCost(model?: string): number {
  return MONTHLY_COST_BY_MODEL[normalizePricingModel(model)] ?? 0;
}

export function isProviderFree(p: { freeTier?: boolean; pricingModel?: string }): boolean {
  const model = normalizePricingModel(p.pricingModel);
  return !!p.freeTier || model === 'free' || model === 'open-source' || model === 'freemium';
}

export function providerPaidCost(p: { pricingModel?: string }): number {
  return pricingModelMonthlyCost(p.pricingModel);
}

export function providerCostLabel(p: {
  freeTier?: boolean;
  pricingModel?: string;
}): string {
  const paid = providerPaidCost(p);
  if (paid > 0) {
    return isProviderFree(p)
      ? `Free tier · ${formatCurrency(paid)}/mo if paid`
      : `${formatCurrency(paid)}/mo`;
  }
  return 'Free';
}

export type CostProviderInfo = {
  providerId: string;
  providerName: string;
  pricingModel?: string;
  freeTier: boolean;
  paidCost: number;
};

export type CostCategoryBreakdown = {
  categoryId: string;
  categoryName: string;
  countedCost: number;
  providers: CostProviderInfo[];
};

export function computeCostBreakdown(stack: UserStack): CostCategoryBreakdown[] {
  const breakdown: CostCategoryBreakdown[] = [];
  for (const entry of stack.categories) {
    if (entry.providers.length === 0) continue;
    const providers: CostProviderInfo[] = entry.providers.map((p) => ({
      providerId: p.providerId,
      providerName: p.name,
      pricingModel: p.pricingModel,
      freeTier: isProviderFree(p),
      paidCost: providerPaidCost(p),
    }));
    const countedCost = providers.reduce(
      (sum, p) => sum + (p.freeTier ? 0 : p.paidCost),
      0,
    );
    breakdown.push({
      categoryId: entry.categoryId,
      categoryName: entry.categoryName,
      countedCost,
      providers,
    });
  }
  return breakdown;
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
  const freeTierCount = providers.filter((p) => isProviderFree(p)).length;
  const openSourceRatio = openSourceCount / providers.length;
  const freeTierRatio = freeTierCount / providers.length;
  const documented = providers.filter((p) => p.documentation || p.website).length / providers.length;

  const estimatedMonthlyCost = computeCostBreakdown(stack).reduce(
    (sum, cat) => sum + cat.countedCost,
    0,
  );

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
