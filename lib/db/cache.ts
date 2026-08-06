export class TtlCache<T> {
  private store = new Map<string, { value: T; expires: number }>();

  constructor(private readonly ttlMs: number) {}

  get(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expires < Date.now()) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  set(key: string, value: T): void {
    this.store.set(key, { value, expires: Date.now() + this.ttlMs });
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }
}

export const providerCache = new TtlCache<unknown>(60_000);

export const categoryCache = new TtlCache<unknown>(5 * 60_000);

export const searchCache = new TtlCache<unknown>(30_000);

export const analysisCache = new TtlCache<unknown>(10 * 60_000);

export function normalizeCacheKey(value: string): string {
  return value.toLowerCase().trim().replace(/\s+/g, ' ');
}
