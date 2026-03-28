/// <reference types="vitest" />
import { describe, it, expect } from 'vitest';
import { applyMove, type AIMove } from '../src/ia/moves';
import type { GameState, Tower } from '../src/game/types';
import { anyValidMoves } from '../src/game/rules';

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

describe('applyMove()', () => {
  it('ends the round when opponent has no moves, sets lastMover, advances currentPlayer, and awards a star', () => {
    // Initial towers: a and b are mergeable; after merging, the set has no valid merges
    // a: h1 sol, b: h1 sol => merge to h2 sol
    // c: h3 luna, d: h5 estrella => no same height or top with merged tower
    const a = makeTower('a', 1, 'sol');
    const b = makeTower('b', 1, 'sol');
    const c = makeTower('c', 3, 'luna');
    const d = makeTower('d', 5, 'estrella');
    const state = baseState({ towers: [a, b, c, d], currentPlayer: 1, players: { 1: { stars: 0 }, 2: { stars: 0 } } });
    expect(anyValidMoves(state.towers)).toBe(true);

    const mv: AIMove = { kind: 'merge', sourceId: a.id, targetId: b.id };
    const next = applyMove(state, mv);

    // Round ends because opponent (P2) has no moves
    expect(next.roundOver).toBe(true);
    // Winner is the mover (P1)
    expect(next.lastMover).toBe(1);
    // Star awarded to P1
    expect(next.players[1].stars).toBe(1);
    // Current player advanced to opponent (P2) for terminal evaluation consistency
    expect(next.currentPlayer).toBe(2);
    // No game over yet
    expect(next.gameOver).toBe(false);
    // Selected cleared
    expect(next.selectedId).toBeNull();
    // Towers reduced by 1
    expect(next.towers.length).toBe(3);
  });

  it('sets gameOver when the winner reaches 4 stars', () => {
    const a = makeTower('a', 1, 'sol');
    const b = makeTower('b', 1, 'sol');
    const x = makeTower('x', 3, 'luna');
    const y = makeTower('y', 5, 'estrella');

    const state = baseState({
      towers: [a, b, x, y],
      currentPlayer: 1,
      players: { 1: { stars: 3 }, 2: { stars: 0 } },
    });

    const mv: AIMove = { kind: 'merge', sourceId: a.id, targetId: b.id };
    const next = applyMove(state, mv);

    expect(next.roundOver).toBe(true);
    expect(next.lastMover).toBe(1);
    expect(next.players[1].stars).toBe(4);
    expect(next.gameOver).toBe(true);
  });
});
