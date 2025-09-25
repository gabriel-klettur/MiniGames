import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import Board from './Board';
import { initialState } from '../game/rules';
import { positions, setCell, posKey } from '../game/board';
import type { GameState, Position } from '../game/types';

const p = (level: number, row: number, col: number): Position => ({ level, row, col });

describe('components/Board', () => {
  it('renders all cells in pyramid mode (sum of all levels)', () => {
    const state: GameState = initialState();
    const html = renderToString(
      <Board
        state={state}
        onCellClick={() => {}}
        posKey={posKey}
        highlights={new Set()}
      />
    );
    // Expect there to be 16 + 9 + 4 + 1 = 30 cell buttons
    const cellCount = (html.match(/class=\"cell\b/g) || []).length;
    expect(cellCount).toBeGreaterThanOrEqual(30);
  });

  it('applies highlight class to highlighted cells', () => {
    const state: GameState = initialState();
    const target = p(0, 0, 0);
    const html = renderToString(
      <Board
        state={state}
        onCellClick={() => {}}
        posKey={posKey}
        highlights={new Set([posKey(target)])}
      />
    );
    expect(html.includes('cell--highlight')).toBe(true);
  });

  it('marks selected piece with piece--selected when selected matches', () => {
    let state: GameState = initialState();
    const where = p(0,0,0);
    state = { ...state, board: setCell(state.board, where, 'L') };
    const html = renderToString(
      <Board
        state={state}
        onCellClick={() => {}}
        posKey={posKey}
        selected={where}
        highlights={new Set()}
      />
    );
    expect(html.includes('piece--selected')).toBe(true);
  });
});
