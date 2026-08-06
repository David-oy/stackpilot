'use client';

import { motion } from 'framer-motion';
import {
  Activity,
  Brain,
  DollarSign,
  Gauge,
  Layers,
  Scale,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useStack } from '@/lib/stack-context';
import { computeCostBreakdown, computeStackHealth, complexityDifficulty, formatCurrency } from '@/lib/stacks/health';
import { stackCategoryCount, stackProviderCount } from '@/lib/stacks/health';
import { Progress } from '@/components/ui/progress';
import { CostBreakdownHover } from './cost-hover';

type Metric = {
  key: string;
  label: string;
  value: number;
  icon: typeof Gauge;
  color: string;
  suffix?: string;
};

function metricColor(value: number): string {
  if (value >= 70) return '[&>div]:bg-emerald-500';
  if (value >= 45) return '[&>div]:bg-amber-500';
  return '[&>div]:bg-rose-500';
}

export function StackHealth() {
  const { activeStack } = useStack();

  const health = activeStack ? computeStackHealth(activeStack) : null;
  if (!activeStack || !health) return null;

  const costBreakdown = computeCostBreakdown(activeStack);
  const difficulty = complexityDifficulty(activeStack.sourceAnalysis?.complexity);

  const metrics: Metric[] = [
    {
      key: 'compatibility',
      label: 'Compatibility',
      value: health.compatibility,
      icon: Scale,
      color: metricColor(health.compatibility),
      suffix: '%',
    },
    {
      key: 'complexity',
      label: 'Complexity',
      value: health.complexity,
      icon: Gauge,
      color: metricColor(100 - health.complexity),
      suffix: '%',
    },
    {
      key: 'learning',
      label: 'Learning Curve',
      value: health.estimatedLearningCurve,
      icon: Brain,
      color: metricColor(health.estimatedLearningCurve),
      suffix: '%',
    },
    {
      key: 'scalability',
      label: 'Scalability',
      value: health.scalability,
      icon: Activity,
      color: metricColor(health.scalability),
      suffix: '%',
    },
    {
      key: 'maintainability',
      label: 'Maintainability',
      value: health.maintainability,
      icon: ShieldCheck,
      color: metricColor(health.maintainability),
      suffix: '%',
    },
    {
      key: 'ai',
      label: 'AI Confidence',
      value: health.aiConfidence,
      icon: Sparkles,
      color: '[&>div]:bg-violet-500',
      suffix: '%',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl glass p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">Stack Health</p>
            <p className="text-xs text-muted-foreground">
              {stackCategoryCount(activeStack)} categories · {stackProviderCount(activeStack)} providers
            </p>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500/20 to-blue-500/20 ring-1 ring-violet-500/20">
            <Activity className="h-5 w-5 text-violet-300" />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-foreground/5 bg-foreground/[0.02] p-3">
            <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Layers className="h-3 w-3" /> Difficulty
            </p>
            <p className="mt-1 text-lg font-semibold text-foreground">{difficulty}</p>
          </div>
          <div className="rounded-xl border border-foreground/5 bg-foreground/[0.02] p-3">
            <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <DollarSign className="h-3 w-3" /> Est. Monthly Cost
            </p>
            <CostBreakdownHover breakdown={costBreakdown}>
              <p className="mt-1 inline-block cursor-help text-lg font-semibold text-foreground underline decoration-dotted decoration-foreground/30 underline-offset-4">
                {formatCurrency(health.estimatedMonthlyCost)}
              </p>
            </CostBreakdownHover>
          </div>
        </div>
      </div>

      <div className="space-y-3 rounded-2xl glass p-5">
        {metrics.map((metric, i) => (
          <motion.div
            key={metric.key}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-center gap-3"
          >
            <metric.icon className={`h-4 w-4 shrink-0 ${metric.key === 'ai' ? 'text-violet-300' : 'text-muted-foreground'}`} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{metric.label}</span>
                <span className="font-medium text-foreground">
                  {metric.value}
                  {metric.suffix ?? ''}
                </span>
              </div>
              <Progress value={metric.value} className={`mt-1.5 h-1.5 ${metric.color}`} />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
