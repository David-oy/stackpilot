'use client';

import type { StackAnalysis } from './types';

export type AnalysisErrorPayload = {
  message: string;
  code?: 'NOT_A_PROJECT';
};

export async function analyzeProject(
  description: string,
  signal?: AbortSignal,
): Promise<StackAnalysis> {
  let response: Response;
  try {
    response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description }),
      signal: signal ?? AbortSignal.timeout(70_000),
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('Analysis timed out. Please try again.');
    }
    throw error;
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    let message = 'Something went wrong while analyzing your project. Please try again.';
    let code: AnalysisErrorPayload['code'];
    if (payload && typeof payload === 'object' && 'error' in payload) {
      const candidate = (payload as { error?: unknown }).error;
      if (typeof candidate === 'string' && candidate) {
        message = candidate;
      }
    }
    if (payload && typeof payload === 'object' && 'code' in payload) {
      const candidate = (payload as { code?: unknown }).code;
      if (candidate === 'NOT_A_PROJECT') code = 'NOT_A_PROJECT';
    }
    const error = new Error(message) as Error & { code?: AnalysisErrorPayload['code'] };
    if (code) error.code = code;
    throw error;
  }

  return payload as StackAnalysis;
}
