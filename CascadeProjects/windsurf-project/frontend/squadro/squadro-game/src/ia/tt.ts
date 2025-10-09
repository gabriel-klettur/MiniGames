import { hashState } from './hash';
import type { GameState } from '../game/types';

// Transposition Table entry types
export type Bound = 'EXACT' | 'LOWER' | 'UPPER';
export interface TTEntry {
  key: number;        // hashed state
  depth: number;      // remaining depth at time of storage
  score: number;      // evaluation (from perspective of root player)
  bound: Bound;       // type of bound
  bestMove?: string;  // optional best move at node
}

export class TranspositionTable {
  private table: Map<number, TTEntry> = new Map();
  private maxSize: number;

  constructor(maxSize = 1 << 20) { // ~1M entries max
    this.maxSize = maxSize;
  }

  get(gs: GameState): TTEntry | undefined {
    const key = hashState(gs);
    return this.table.get(key);
  }

  set(gs: GameState, entry: Omit<TTEntry, 'key'>): void {
    if (this.table.size >= this.maxSize) {
      // Simple replacement strategy: clear a fraction to free memory
      // More sophisticated schemes (2-cluster) can be added later.
      let removed = 0;
      for (const k of this.table.keys()) {
        this.table.delete(k);
        if (++removed > this.maxSize >> 2) break;
      }
    }
    const key = hashState(gs);
    const prev = this.table.get(key);
    if (!prev || entry.depth >= prev.depth) {
      this.table.set(key, { ...entry, key });
    }
  }

  clear(): void {
    this.table.clear();
  }
}
