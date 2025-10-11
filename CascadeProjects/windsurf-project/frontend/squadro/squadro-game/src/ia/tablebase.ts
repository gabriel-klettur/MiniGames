import { hashState } from './hash';
import type { GameState } from '../game/types';

export type TBValue = 'win' | 'loss' | 'draw';
export interface TBEntry {
  value: TBValue;
  bestMove?: string;
  pv?: string[];
  score?: number; // optional heuristic score to use
}

// In-memory tablebase (singleton for now)
const TB = new Map<bigint, TBEntry>();

export function clear(): void { TB.clear(); }
export function add(key: bigint, entry: TBEntry): void { TB.set(key, entry); }
export function load(entries: Array<{ key: bigint; entry: TBEntry }>): void {
  for (const e of entries) TB.set(e.key, e.entry);
}

export function probe(gs: GameState): TBEntry | null {
  const k = hashState(gs);
  return TB.get(k) || null;
}
