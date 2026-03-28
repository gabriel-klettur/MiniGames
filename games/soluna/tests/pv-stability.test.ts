/// <reference types="vitest" />
import { describe, it, expect } from 'vitest';
import type { GameState, Tower } from '../src/game/types';
import { bestMove as searchBestMove, type SearchStats } from '../src/ia/search';

function makeTower(id: string, height: number, top: Tower['top'], x = 0.5, y = 0.5): Tower {
  const stack = Array.from({ length: height }, () => top);
  return { id, stack, height, top, pos: { x, y } };
}

function baseState(partial?: Partial<GameState>): GameState {
  const defaults: GameState = {
    towers: [],
    selectedId: null,
    currentPlayer: 1,
    lastMover: null,
    roundOver: false,
    gameOver: false,
    players: { 1: { stars: 0 }, 2: { stars: 0 } },
    mergeFx: null,
  } as any;
  return { ...defaults, ...(partial || {}) } as GameState;
}

// Curated position with multiple reasonable merges but stable best under deeper search
function curatedPosition(): GameState {
  const t1 = makeTower('a', 1, 'sol');
  const t2 = makeTower('b', 1, 'sol');
  const t3 = makeTower('c', 1, 'luna');
  const t4 = makeTower('d', 1, 'luna');
  const t5 = makeTower('e', 2, 'estrella');
  const t6 = makeTower('f', 2, 'estrella');
  return baseState({ towers: [t1, t2, t3, t4, t5, t6], currentPlayer: 1 });
}

describe('PV stability across iterative deepening', () => {
  it('best move remains stable from depth=2 to depth=4 (no quiescence)', () => {
    const s = curatedPosition();
    const r2 = searchBestMove(s, 2, { nodes: 0 }, { enableQuiescence: false });
    const r4 = searchBestMove(s, 4, { nodes: 0 }, { enableQuiescence: false });
    expect(r2.move).not.toBeNull();
    expect(r4.move).not.toBeNull();
    const ids2 = new Set([r2.move!.sourceId, r2.move!.targetId]);
    const ids4 = new Set([r4.move!.sourceId, r4.move!.targetId]);
    expect(ids2).toEqual(ids4);
  });
});
