'use client';

import type { StackAnalysis } from './types';

export type AnalysisErrorCode = 'NOT_A_PROJECT' | 'INVALID_INPUT' | 'TOO_LONG';

export async function analyzeProject(
  description: string,
  signal?: AbortSignal,
): Promise<StackAnalysis> {
  let response: Response;
  // Always enforce a hard timeout, even when the caller passes their own
  // AbortSignal (e.g. useAnalysis). Aborting on timeout must NOT abort the
  // caller's controller so the caller can still distinguish a timed-out
  // request from a stale one.
  const controller = new AbortController();
  const onExternalAbort = () => controller.abort(signal?.reason);
  signal?.addEventListener('abort', onExternalAbort, { once: true });
  const timer = setTimeout(() => controller.abort(), 70_000);
  try {
    response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description }),
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('Analysis timed out. Please try again.');
    }
    throw error;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', onExternalAbort);
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    let message = 'Something went wrong while analyzing your project. Please try again.';
    let code: AnalysisErrorCode | undefined;
    if (payload && typeof payload === 'object' && 'error' in payload) {
      const candidate = (payload as { error?: unknown }).error;
      if (typeof candidate === 'string' && candidate) {
        message = candidate;
      }
    }
    if (payload && typeof payload === 'object' && 'code' in payload) {
      const candidate = (payload as { code?: unknown }).code;
      if (candidate === 'NOT_A_PROJECT' || candidate === 'INVALID_INPUT' || candidate === 'TOO_LONG') {
        code = candidate;
      }
    }
    const error = new Error(message) as Error & { code?: AnalysisErrorCode };
    if (code) error.code = code;
    throw error;
  }

  return payload as StackAnalysis;
}
