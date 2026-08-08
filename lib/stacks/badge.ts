import type { ComponentType } from 'react';
import { Star, Trophy, ShieldCheck, Zap, DollarSign, GraduationCap, TrendingUp } from 'lucide-react';
import type { ProviderWithRelations } from '@/lib/db/schema';
import { isProviderFree } from './health';

export function compareBadge(
  provider: ProviderWithRelations,
  group: ProviderWithRelations[],
): string | null {
  if (!group || group.length === 0) return null;

  const popularity = group.map((p) => p.popularityScore ?? 0);
  const ratings = group.map((p) => p.stack2SetRating ?? p.communityRating ?? 0);
  const speeds = group.map((p) => p.speed ?? 0);
  const scale = group.map((p) => p.scalability ?? 0);
  const costs = group.map((p) => (isProviderFree(p) ? 0 : p.monthlyCost ?? 50));
  const learning = group.map((p) => (typeof p.learningCurve === 'number' ? p.learningCurve : 5));

  const maxIndex = (arr: number[]) => arr.indexOf(Math.max(...arr));
  const minIndex = (arr: number[]) => arr.indexOf(Math.min(...arr));
  const idx = group.findIndex((p) => p.slug === provider.slug);
  if (idx < 0) return null;

  if (idx === maxIndex(popularity) && Math.max(...popularity) > 0) return 'Most popular';
  if (idx === maxIndex(ratings) && Math.max(...ratings) > 0) return 'Best rated';
  if (idx === maxIndex(speeds) && Math.max(...speeds) > 0) return 'Fastest';
  if (idx === maxIndex(scale) && Math.max(...scale) > 0) return 'Most scalable';
  if (idx === minIndex(costs) && costs[idx] === 0) return 'Free';
  if (idx === minIndex(costs) && Math.max(...costs) > 0) return 'Best value';
  if (idx === minIndex(learning) && provider.learningCurve !== undefined) return 'Easiest to learn';
  return null;
}

export function badgeIcon(badge: string): ComponentType<{ className?: string }> {
  switch (badge) {
    case 'Most popular':
      return TrendingUp;
    case 'Best rated':
      return Star;
    case 'Most secure':
      return ShieldCheck;
    case 'Fastest':
      return Zap;
    case 'Best value':
      return DollarSign;
    case 'Easiest to learn':
      return GraduationCap;
    default:
      return Trophy;
  }
}
