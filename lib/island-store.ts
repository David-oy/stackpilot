/**
 * Single canonical Dynamic Island state machine.
 *
 * IDLE           landing / resting — the island shows the CTA (Get the Stack / View Demo)
 * ANALYZING      generic "in flight" state before a specific phase is known
 * UNDERSTANDING  AI is reading the project idea
 * DATABASE       checking our provider database
 * PROVIDERS      ranking the best-fit providers
 * ASSEMBLING     gathering the stack together
 * COMPLETE       the stack is ready to view
 * SAVED          the stack was persisted to the cloud
 */
export type IslandPhase =
  | 'idle'
  | 'analyzing'
  | 'understanding'
  | 'database'
  | 'providers'
  | 'assembling'
  | 'complete'
  | 'saved';

type Listener = (phase: IslandPhase) => void;

let currentPhase: IslandPhase = 'idle';
const listeners = new Set<Listener>();

export function setIslandPhase(phase: IslandPhase) {
  if (phase === currentPhase) return;
  currentPhase = phase;
  for (const listener of listeners) listener(phase);
}

export function getIslandPhase(): IslandPhase {
  return currentPhase;
}

export function subscribeIslandPhase(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
