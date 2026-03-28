import { hashState } from './hash';
import type { GameState } from '../game/types';

// Transposition Table entry types
export type Bound = 'EXACT' | 'LOWER' | 'UPPER';
export interface TTEntry {
  key: bigint;        // hashed state (64-bit)
  depth: number;      // remaining depth at time of storage
  score: number;      // evaluation (from perspective of root player)
  bound: Bound;       // type of bound
  bestMove?: string;  // optional best move at node
  gen?: number;       // aging generation
}

export class TranspositionTable {
  // 2-cluster buckets
  private buckets: Array<[TTEntry | undefined, TTEntry | undefined]>;
  private mask: bigint; // bucket index mask (power-of-two size)
  private generation = 0;

  /**
   * @param bucketCount Number of buckets (power of two). Capacity = bucketCount * 2 entries.
   */
  constructor(bucketCount = 1 << 20) {
    // force power of two
    let n = 1;
    while (n < bucketCount) n <<= 1;
    this.buckets = new Array(n);
    for (let i = 0; i < n; i++) this.buckets[i] = [undefined, undefined];
    this.mask = BigInt(n - 1);
  }

  private indexOf(key: bigint): number {
    // Use low bits for bucket index
    const idx = Number(key & this.mask);
    return idx;
  }

  get(gs: GameState): TTEntry | undefined {
    const key = hashState(gs);
    const b = this.buckets[this.indexOf(key)];
    const e0 = b[0];
    if (e0 && e0.key === key) return e0;
    const e1 = b[1];
    if (e1 && e1.key === key) return e1;
    return undefined;
  }

  set(gs: GameState, entry: Omit<TTEntry, 'key' | 'gen'>): void {
    const key = hashState(gs);
    const bucket = this.buckets[this.indexOf(key)];
    const e0 = bucket[0];
    const e1 = bucket[1];
    const newEntry: TTEntry = { ...entry, key, gen: this.generation };

    // If slot with same key exists, replace if deeper or equal depth (prefer fresher)
    if (e0 && e0.key === key) {
      if (entry.depth >= e0.depth) bucket[0] = newEntry;
      return;
    }
    if (e1 && e1.key === key) {
      if (entry.depth >= e1.depth) bucket[1] = newEntry;
      return;
    }

    // Choose replacement: prefer shallower depth, then older generation
    const s0 = e0 ? e0.depth : -1;
    const s1 = e1 ? e1.depth : -1;
    if (!e0) { bucket[0] = newEntry; return; }
    if (!e1) { bucket[1] = newEntry; return; }

    if (s0 < s1) { bucket[0] = newEntry; return; }
    if (s1 < s0) { bucket[1] = newEntry; return; }
    // equal depth -> replace older generation
    const g0 = e0!.gen ?? 0;
    const g1 = e1!.gen ?? 0;
    if (g0 <= g1) bucket[0] = newEntry; else bucket[1] = newEntry;
  }

  tickGeneration(): void { this.generation = (this.generation + 1) | 0; }

  clear(): void {
    for (let i = 0; i < this.buckets.length; i++) this.buckets[i] = [undefined, undefined];
    this.tickGeneration();
  }
}
