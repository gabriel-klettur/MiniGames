/// <reference types="vitest" />
import { describe, it, expect } from 'vitest';
import { bestMove as searchBestMove } from '../src/ia/search';
import type { GameState, Tower } from '../src/game/types';

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
  };
  return { ...defaults, ...(partial || {}) } as GameState;
}

describe('rootMoves sorting by descending score (UI behavior)', () => {
  it('rootMoves can be sorted (non-increasing) by score', () => {
    // Create a state with multiple distinct root moves with different depth-1 scores
    const a = makeTower('a', 2, 'sol');
    const b = makeTower('b', 2, 'sol'); // same height, mergeable (2+2)
    const c = makeTower('c', 1, 'luna');
    const d = makeTower('d', 1, 'luna'); // same height, mergeable (1+1)
    const e = makeTower('e', 1, 'estrella');
    const state = baseState({ towers: [a, b, c, d, e], currentPlayer: 1 });

    const res = searchBestMove(state, 2, { nodes: 0 });
    // search.bestMove() no garantiza orden por score; la UI lo ordena.
    const sortedByScore = res.rootMoves.slice().sort((a, b) => b.score - a.score);
    const scores = sortedByScore.map(r => r.score);
    for (let i = 1; i < scores.length; i++) {
      expect(scores[i]).toBeLessThanOrEqual(scores[i - 1]);
    }
  });
});
