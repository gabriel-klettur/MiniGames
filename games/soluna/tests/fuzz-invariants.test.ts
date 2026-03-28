/// <reference types="vitest" />
import { describe, it, expect } from 'vitest';
import { generateAllMoves, applyMove, type AIMove } from '../src/ia/moves';
import { anyValidMoves, canMerge } from '../src/game/rules';
import type { GameState, Tower } from '../src/game/types';
import { evaluate } from '../src/ia/evaluate';

// Simple deterministic PRNG (LCG)
function lcg(seed: number) {
  let s = seed >>> 0;
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 0xffffffff;
}

const SYMBOLS: Tower['top'][] = ['sol', 'luna', 'estrella', 'fugaz'];

function makeTower(id: string, height: number, top: Tower['top'], x: number, y: number): Tower {
  const stack = Array.from({ length: height }, () => top);
  return { id, stack, height, top, pos: { x, y } };
}

function randomState(seed = 1234, n = 8): GameState {
  const rnd = lcg(seed);
  const towers: Tower[] = [];
  for (let i = 0; i < n; i++) {
    const h = 1 + Math.floor(rnd() * 3); // heights 1..3
    const top = SYMBOLS[Math.floor(rnd() * SYMBOLS.length)];
    const x = rnd();
    const y = rnd();
    towers.push(makeTower(`t${i}`, h, top, x, y));
  }
  const state: GameState = {
    towers,
    selectedId: null,
    currentPlayer: 1,
    lastMover: null,
    roundOver: false,
    gameOver: false,
    players: { 1: { stars: 0 }, 2: { stars: 0 } },
    mergeFx: null,
  };
  return state;
}

describe('Fuzz invariants (random states)', () => {
  it('anyValidMoves() iff generateAllMoves().length > 0 (across seeds)', () => {
    for (let seed = 1; seed <= 5; seed++) {
      const st = randomState(1000 + seed, 10);
      const ms = generateAllMoves(st);
      const any = anyValidMoves(st.towers);
      expect(any).toBe(ms.length > 0);
    }
  });

  it('generateAllMoves yields 2k directed moves where k undirected pairs are mergeable', () => {
    for (let seed = 1; seed <= 5; seed++) {
      const st = randomState(2000 + seed, 10);
      const ts = st.towers;
      let k = 0;
      for (let i = 0; i < ts.length; i++) {
        for (let j = i + 1; j < ts.length; j++) {
          if (canMerge(ts[i], ts[j]) || canMerge(ts[j], ts[i])) k++;
        }
      }
      const ms = generateAllMoves(st);
      expect(ms.length).toBe(2 * k);
    }
  });

  it('applyMove reduces towers by 1 and preserves invariants; when roundOver, winner gets +1 star and evaluate matches terminal', () => {
    const st = randomState(3001, 8);
    let state = st;
    const initialStars = { ...state.players };
    let steps = 0;
    while (!state.roundOver && steps < 20) {
      const moves = generateAllMoves(state);
      if (moves.length === 0) break;
      const mv: AIMove = moves[0];
      const prevCount = state.towers.length;
      const mover = state.currentPlayer;
      state = applyMove(state, mv);
      // towers shrink by 1
      expect(state.towers.length).toBe(prevCount - 1);
      // invariants
      for (const t of state.towers) {
        expect(t.height).toBe(t.stack.length);
        expect(t.top).toBe(t.stack[t.stack.length - 1]);
      }
      steps++;
    }
    if (state.roundOver) {
      const last = state.lastMover!;
      expect(state.players[last].stars).toBe(initialStars[last].stars + 1);
      expect(evaluate(state, last)).toBe(Number.POSITIVE_INFINITY / 2);
      const other = last === 1 ? 2 : 1;
      expect(evaluate(state, other)).toBe(Number.NEGATIVE_INFINITY / 2);
    }
  });
});
