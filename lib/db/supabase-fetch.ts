export function fetchWithTimeout(timeoutMs: number): typeof fetch {
  return (input, init) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const cleanup = () => clearTimeout(timer);
    const existing = init?.signal;
    const noStore: RequestInit = { ...init, cache: 'no-store', signal: controller.signal };

    if (existing) {
      if (existing.aborted) {
        clearTimeout(timer);
        controller.abort();
      } else {
        const onAbort = () => controller.abort();
        existing.addEventListener('abort', onAbort);
        return fetch(input, noStore).finally(() => {
          clearTimeout(timer);
          existing.removeEventListener('abort', onAbort);
        });
      }
    }

    return fetch(input, noStore).finally(cleanup);
  };
}
