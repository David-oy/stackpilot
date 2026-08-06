const ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';

function randomInt(max: number): number {
  const bytes = new Uint32Array(1);
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    crypto.getRandomValues(bytes);
    return bytes[0] % max;
  }
  return Math.floor(Math.random() * max);
}

/** Short human-friendly id, e.g. `k7f3pQ9x`. Works in browser and server. */
export function generateId(length = 9): string {
  let out = '';
  for (let i = 0; i < length; i += 1) {
    out += ALPHABET[randomInt(ALPHABET.length)];
  }
  return out;
}
