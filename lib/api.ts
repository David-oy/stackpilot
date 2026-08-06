'use client';

import type { StackAnalysis } from './types';

export async function analyzeProject(description: string): Promise<StackAnalysis> {
  let response: Response;
  try {
    response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description }),
      signal: AbortSignal.timeout(70_000),
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
