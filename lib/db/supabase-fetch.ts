export function fetchWithTimeout(timeoutMs: number): typeof fetch {
  return (input, init) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const cleanup = () => clearTimeout(timer);
    const existing = init?.signal;

    if (existing) {
      if (existing.aborted) {
        clearTimeout(timer);
        controller.abort();
      } else {
        const onAbort = () => controller.abort();
        existing.addEventListener('abort', onAbort);
        return fetch(input, { ...init, signal: controller.signal }).finally(() => {
          clearTimeout(timer);
          existing.removeEventListener('abort', onAbort);
        });
      }
    }

    return fetch(input, { ...init, signal: controller.signal }).finally(cleanup);
  };
}
