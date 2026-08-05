export type AnalysisProvider = {
  id: string;
  name: string;
  description: string;
  reason?: string;
};

export type AnalysisCategory = {
  id: string;
  name: string;
  description: string;
  providers: AnalysisProvider[];
};

export type Complexity = 'Low' | 'Medium' | 'High';

export type StackAnalysis = {
  projectType: string;
  summary: string;
  complexity: Complexity;
  categories: AnalysisCategory[];
};
