export const MAX_DESCRIPTION_LENGTH = 2500;

export type AnalysisInputErrorCode = 'INVALID_INPUT' | 'TOO_LONG';

export type AnalysisInputIssue =
  | { ok: true }
  | { ok: false; code: AnalysisInputErrorCode; message: string };

/**
 * Fast-path heuristic that rejects obvious gibberish before any paid
 * AI call. The LLM's `isProject` decision is authoritative; this only
 * saves a Gemini round-trip on clearly meaningless input.
 *
 * Kept dependency-free so it can run on the client (validation before
 * "Analyzing...") and on the server (validation before Gemini billing).
 */
export function isLikelyGibberish(input: string): boolean {
  const text = input.trim();
  if (!text) return true;
  if (text.length < 4) return true;

  const lower = text.toLowerCase();
  const letters = lower.replace(/[^a-z]/g, '');

  // No real letters at all (e.g. "1234 5678").
  if (!/[a-z]/.test(letters)) return true;

  // Keyboard rows / repeated keystroke runs.
  if (/qwerty|asdf|zxcv/.test(letters)) return true;
  if (/(.)\1{4,}/.test(letters)) return true;

  // Consonant mash with almost no vowels (e.g. "asdkjfhasjkdfh").
  const vowels = (letters.match(/[aeiouy]/g) ?? []).length;
  if (letters.length >= 8 && vowels / letters.length < 0.18) return true;

  // Require at least one real word (a token containing a vowel).
  const words = text.split(/\s+/);
  const wordy = words.filter((w) => /[a-z]/i.test(w) && /[aeiouy]/i.test(w.toLowerCase()));
  if (wordy.length === 0) return true;

  return false;
}

export function validateDescription(input: string): AnalysisInputIssue {
  const text = input.trim();
  if (!text) {
    return {
      ok: false,
      code: 'INVALID_INPUT',
      message: 'Describe what you want to build first, e.g. "a video streaming app like Netflix".',
    };
  }
  if (text.length > MAX_DESCRIPTION_LENGTH) {
    return {
      ok: false,
      code: 'TOO_LONG',
      message: `That description is too long. Keep it under ${MAX_DESCRIPTION_LENGTH.toLocaleString()} characters.`,
    };
  }
  if (isLikelyGibberish(text)) {
    return {
      ok: false,
      code: 'INVALID_INPUT',
      message:
        'That doesn\u2019t look like a software project. Try describing what you want to build, e.g. "a video streaming app like Netflix".',
    };
  }
  return { ok: true };
}
