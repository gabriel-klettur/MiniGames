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

// Construct a position with legal moves at root but where a single merge does not immediately end the round
function nonTacticalPosition(): GameState {
  // Mix of symbols and heights to avoid immediate round end on one merge
  const t1 = makeTower('a', 1, 'sol');
  const t2 = makeTower('b', 1, 'sol'); // can merge with t1
  const t3 = makeTower('c', 2, 'luna');
  const t4 = makeTower('d', 2, 'luna'); // can merge with t3
  const t5 = makeTower('e', 3, 'estrella');
  const t6 = makeTower('f', 3, 'estrella'); // can merge with t5
  return baseState({ towers: [t1, t2, t3, t4, t5, t6], currentPlayer: 1 });
}

describe('quiescence (sanity)', () => {
  it('when enabled on a non-tactical position, preserves best move and visits >= nodes vs disabled', () => {
    const s = nonTacticalPosition();

    const statsOff: SearchStats = { nodes: 0 };
    const off = searchBestMove(s, 2, statsOff, { enableQuiescence: false });

    const statsOn: SearchStats = { nodes: 0 };
    const on = searchBestMove(s, 2, statsOn, { enableQuiescence: true, quiescenceDepth: 3 });

    // Best move should be the same (id set comparison for merge pairs)
    const offIds = off.move ? new Set([off.move.sourceId, off.move.targetId]) : null;
    const onIds = on.move ? new Set([on.move.sourceId, on.move.targetId]) : null;
    expect(offIds).not.toBeNull();
    expect(onIds).not.toBeNull();
    expect(offIds).toEqual(onIds);

    // Quiescence typically explores more nodes or equal
    expect(statsOn.nodes).toBeGreaterThanOrEqual(statsOff.nodes);
  });
});
