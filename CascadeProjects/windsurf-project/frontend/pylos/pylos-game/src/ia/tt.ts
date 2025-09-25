import { keyToIndex, type Key64 } from './zobrist';
import type { MoveSignature } from './signature';

// Use const object instead of enum to satisfy "erasableSyntaxOnly" environments
export const TTFlag = { EXACT: 0, LOWER: 1, UPPER: 2 } as const;
export type TTFlag = typeof TTFlag[keyof typeof TTFlag];

export interface TTEntry {
  keyHi: number;
  keyLo: number;
  depth: number; // search depth stored
  value: number; // evaluation at node from perspective of side-to-move when stored
  flag: TTFlag;
  bestMove: MoveSignature | 0;
}

export class TranspositionTable {
  private mask: number;
  private keyHi: Uint32Array;
  private keyLo: Uint32Array;
  private depth: Int16Array;
  private value: Int32Array;
  private flag: Uint8Array;
  private best: Uint32Array;

  constructor(sizePow2 = 18) {
    const n = 1 << sizePow2;
    this.mask = n - 1;
    this.keyHi = new Uint32Array(n);
    this.keyLo = new Uint32Array(n);
    this.depth = new Int16Array(n);
    this.value = new Int32Array(n);
    this.flag = new Uint8Array(n);
    this.best = new Uint32Array(n);
  }

  clear(): void {
    this.keyHi.fill(0);
    this.keyLo.fill(0);
    this.depth.fill(0);
    this.value.fill(0);
    this.flag.fill(0);
    this.best.fill(0);
  }

  probe(key: Key64): TTEntry | null {
    const idx = keyToIndex(key, this.mask);
    if (this.keyHi[idx] === key.hi && this.keyLo[idx] === key.lo) {
      return {
        keyHi: this.keyHi[idx],
        keyLo: this.keyLo[idx],
        depth: this.depth[idx],
        value: this.value[idx],
        flag: this.flag[idx] as TTFlag,
        bestMove: this.best[idx] as MoveSignature,
      };
    }
    return null;
    }

  store(key: Key64, depth: number, value: number, flag: TTFlag, bestMove: MoveSignature | 0): void {
    const idx = keyToIndex(key, this.mask);
    // Replace policy: prefer deeper, else always replace
    if (this.keyHi[idx] === key.hi && this.keyLo[idx] === key.lo) {
      if (depth < this.depth[idx]) return;
    }
    this.keyHi[idx] = key.hi >>> 0;
    this.keyLo[idx] = key.lo >>> 0;
    this.depth[idx] = depth as any;
    this.value[idx] = (value | 0);
    this.flag[idx] = flag as any;
    this.best[idx] = (bestMove >>> 0);
  }
}

// Singleton table for simplicity of integration
export const TT = new TranspositionTable(18);
