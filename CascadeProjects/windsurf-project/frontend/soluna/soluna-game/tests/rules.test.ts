/// <reference types="vitest" />
import { describe, it, expect } from 'vitest';
import { canMerge, anyValidMoves, mergeTowers, replaceAfterMerge } from '../src/game/rules';
import type { Tower, GameState } from '../src/game/types';

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

describe('game/rules', () => {
  it('canMerge: false for same id', () => {
    const a = makeTower('a', 1, 'sol');
    expect(canMerge(a, a)).toBe(false);
  });

  it('canMerge: true for same top symbol', () => {
    const a = makeTower('a', 1, 'sol');
    const b = makeTower('b', 2, 'sol');
    expect(canMerge(a, b)).toBe(true);
    expect(canMerge(b, a)).toBe(true);
  });

  it('canMerge: true for same height even with different top', () => {
    const a = makeTower('a', 2, 'sol');
    const b = makeTower('b', 2, 'luna');
    expect(canMerge(a, b)).toBe(true);
  });

  it('canMerge: false when neither same height nor same top', () => {
    const a = makeTower('a', 1, 'sol');
    const b = makeTower('b', 2, 'luna');
    expect(canMerge(a, b)).toBe(false);
  });

  it('anyValidMoves: detects availability of at least one merge', () => {
    const a = makeTower('a', 1, 'sol');
    const b = makeTower('b', 1, 'sol');
    const c = makeTower('c', 2, 'luna');
    expect(anyValidMoves([a, b, c])).toBe(true);
  });

  it('anyValidMoves: false when nothing is mergeable', () => {
    const a = makeTower('a', 1, 'sol');
    const b = makeTower('b', 2, 'luna');
    expect(anyValidMoves([a, b])).toBe(false);
  });

  it('mergeTowers: source placed on top of target, keeping target position', () => {
    const source = makeTower('s', 1, 'luna', 0.2, 0.3);
    const target = makeTower('t', 2, 'sol', 0.7, 0.8);
    const merged = mergeTowers(source, target);
    // id must change
    expect(merged.id).not.toBe(source.id);
    expect(merged.id).not.toBe(target.id);
    // stack order is target.stack followed by source.stack
    expect(merged.stack).toEqual([...target.stack, ...source.stack]);
    // height equals length
    expect(merged.height).toBe(merged.stack.length);
    // top equals source.top
    expect(merged.top).toBe(source.top);
    // position remains target.pos
    expect(merged.pos).toEqual(target.pos);
  });

  it('replaceAfterMerge: removes source and target, inserts merged', () => {
    const a = makeTower('a', 1, 'sol');
    const b = makeTower('b', 1, 'sol');
    const c = makeTower('c', 2, 'luna');
    const merged = mergeTowers(a, b);
    const next = replaceAfterMerge([a, b, c], a.id, b.id, merged);
    expect(next.find(t => t.id === a.id)).toBeUndefined();
    expect(next.find(t => t.id === b.id)).toBeUndefined();
    expect(next.some(t => t.id === merged.id)).toBe(true);
    expect(next.length).toBe(2);
  });
});
