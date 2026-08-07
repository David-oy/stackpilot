/**
 * Minimal per-key sliding-window rate limiter for expensive, billed work
 * (e.g. Gemini analysis). In-memory only — best-effort on serverless where
 * each instance keeps its own window, but still caps abuse per instance.
 */

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 10;
const HOUR_WINDOW_MS = 3_600_000;
const MAX_PER_HOUR = 60;

const buckets = new Map<string, number[]>();

function prune(bucket: number[], now: number, windowMs: number): void {
  let i = 0;
  while (i < bucket.length && now - bucket[i] >= windowMs) i += 1;
  if (i > 0) bucket.splice(0, i);
}

export function checkRateLimit(
  key: string,
): { allowed: boolean; retryAfterSec: number } {
  const now = Date.now();

  const minuteKey = `m:${key}`;
  const hourKey = `h:${key}`;
  let minute = buckets.get(minuteKey);
  if (!minute) {
    minute = [];
    buckets.set(minuteKey, minute);
  }
  let hour = buckets.get(hourKey);
  if (!hour) {
    hour = [];
    buckets.set(hourKey, hour);
  }
  prune(minute, now, WINDOW_MS);
  prune(hour, now, HOUR_WINDOW_MS);

  if (minute.length >= MAX_PER_WINDOW || hour.length >= MAX_PER_HOUR) {
    const oldest = Math.min(minute[0] ?? now, hour[0] ?? now);
    const retryAfterSec = Math.max(1, Math.ceil((WINDOW_MS - (now - oldest)) / 1000));
    return { allowed: false, retryAfterSec };
  }

  minute.push(now);
  hour.push(now);
  return { allowed: true, retryAfterSec: 0 };
}

// Periodically drop empty buckets so the map never grows unbounded.
const interval = setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    prune(bucket, now, HOUR_WINDOW_MS);
    if (bucket.length === 0) buckets.delete(key);
  }
}, 5 * WINDOW_MS);

// Don't keep the Node process alive on long-running instances.
if (typeof (interval as { unref?: () => void }).unref === 'function') {
  (interval as { unref: () => void }).unref();
}
