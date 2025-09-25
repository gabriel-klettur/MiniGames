import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import FasePanel from './FasePanel';
import { initialState } from '../game/rules';

const clone = <T,>(obj: T): T => JSON.parse(JSON.stringify(obj));

describe('components/FasePanel', () => {
  it('renders play phase message by default', () => {
    const s = initialState();
    const html = renderToString(<FasePanel state={s} />);
    expect(html).toContain('Fase');
    expect(html).toContain('Elige una casilla vacía');
  });

  it('renders recover phase message with remaining and minRequired', () => {
    const s = clone(initialState());
    const s2 = { ...s, phase: 'recover' as const, recovery: { player: 'L' as const, remaining: 2, minRequired: 1, removedSoFar: 0 } };
    const html = renderToString(<FasePanel state={s2} />);
    expect(html).toContain('Recupera');
    expect(html).toContain('al menos 1');
  });

  it('renders selectMoveDest message', () => {
    const s = clone(initialState());
    const s2 = { ...s, phase: 'selectMoveDest' as const };
    const html = renderToString(<FasePanel state={s2} />);
    expect(html).toContain('Elige un destino válido');
  });

  it('shows gameOverText when provided', () => {
    const s = initialState();
    const html = renderToString(<FasePanel state={s} gameOverText="Ganador: IA" />);
    expect(html).toContain('Ganador: IA');
  });
});
