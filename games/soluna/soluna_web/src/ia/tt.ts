import type { AIMove } from './moves';

export type TTFlag = 'EXACT' | 'LOWER' | 'UPPER';

export interface TTEntry {
  key: bigint;
  depth: number; // remaining depth searched from this node
  value: number; // evaluated score (fail-soft compatible)
  flag: TTFlag;
  best?: AIMove; // best move found from this node (hash move)
}

/**
 * Simple transposition table backed by a Map with a soft size limit.
 * Replacement policy: prefer deeper entries; otherwise replace older ones.
 */
export class TranspositionTable {
  private table: Map<bigint, TTEntry>;
  private order: Array<bigint>;
  private maxEntries: number;

  constructor(maxEntries: number = 1 << 20 /* ~1M entries */) {
    this.table = new Map();
    this.order = [];
    this.maxEntries = maxEntries;
  }

  clear(): void {
    this.table.clear();
    this.order = [];
  }

  get(key: bigint): TTEntry | undefined {
    return this.table.get(key);
  }

  set(entry: TTEntry): void {
    const prev = this.table.get(entry.key);
    if (prev) {
      // Prefer keeping the deeper search result
      if (prev.depth > entry.depth) return;
    }
    this.table.set(entry.key, entry);
    this.order.push(entry.key);
    if (this.order.length > this.maxEntries) {
      const k = this.order.shift();
      if (k !== undefined && k !== entry.key) this.table.delete(k);
    }
  }
}

// Global TT instance for the IA search to reuse across nodes and depths
export const GlobalTT = new TranspositionTable(1 << 18); // ~262k entries as a safe default

export function clearGlobalTT(): void {
  GlobalTT.clear();
}
