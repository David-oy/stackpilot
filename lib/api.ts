'use client';

import type { StackAnalysis } from './types';

export async function analyzeProject(description: string): Promise<StackAnalysis> {
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ description }),
  });

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    let message = 'Something went wrong while analyzing your project. Please try again.';
    if (payload && typeof payload === 'object' && 'error' in payload) {
      const candidate = (payload as { error?: unknown }).error;
      if (typeof candidate === 'string' && candidate) {
        message = candidate;
      }
    }
    throw new Error(message);
  }

  return payload as StackAnalysis;
}
