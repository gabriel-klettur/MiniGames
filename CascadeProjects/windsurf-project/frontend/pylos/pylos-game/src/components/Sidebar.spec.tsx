import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import Sidebar from './Sidebar';
import { initialState } from '../game/rules';

const noop = () => {};

describe('components/Sidebar SSR', () => {
  it('renders HeaderPanel and toggles area (tools off by default)', () => {
    const s = initialState();
    const html = renderToString(
      <Sidebar
        state={s}
        onNewGame={noop}
        onToggleBoardMode={noop}
        gameOverText={undefined}
        boardMode={'pyramid'}
      />
    );
    expect(html).toContain('Nueva partida');
    // Tools are hidden by default; but structure should render
    expect(html).toContain('sidebar');
  });
});
