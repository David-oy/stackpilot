import type { Complexity } from '@/lib/types';

/**
 * A single provider choice stored inside a stack entry.
 * Self-contained snapshot so a stack renders without the database.
 */
export type StackProviderInput = {
  providerId: string;
  name: string;
  description: string;
  reason?: string;
  website?: string;
  documentation?: string;
  github?: string;
  pricingModel?: string;
  popularityScore?: number;
  freeTier?: boolean;
  openSource?: boolean;
  tags?: string[];
  features?: string[];
};

export type StackProviderItem = StackProviderInput & {
  addedAt: string;
};

export type StackCategory = {
  categoryId: string;
  categoryName: string;
  collapsed: boolean;
  providers: StackProviderItem[];
};

export type UserStack = {
  id: string;
  name: string;
  prompt: string;
  createdAt: string;
  updatedAt: string;
  sourceAnalysis?: {
    projectType?: string;
    summary?: string;
    complexity?: Complexity;
  } | null;
  categories: StackCategory[];
};

export type StackHealth = {
  compatibility: number;
  complexity: number;
  estimatedLearningCurve: number;
  estimatedMonthlyCost: number;
  scalability: number;
  maintainability: number;
  aiConfidence: number;
};

export type ComparisonRow = {
  label: string;
  values: string[];
};

export type Comparison = {
  headers: string[];
  rows: ComparisonRow[];
};

export type SharePayload = {
  id: string;
  createdAt: string;
  name: string;
  prompt: string;
  projectType?: string;
  summary?: string;
  complexity?: Complexity;
  difficulty: string;
  estimatedMonthlyCost: number;
  categories: StackCategory[];
  health: StackHealth;
  stackId?: string;
};

export const STACK_EXPORT_TYPE = 'stackpilot-stack';
export const STACK_EXPORT_VERSION = 1;

export type StackExportFile = {
  type: typeof STACK_EXPORT_TYPE;
  version: typeof STACK_EXPORT_VERSION;
  exportedAt: string;
  stack: UserStack;
  health: StackHealth;
};
