import { describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { useBoardMode } from './useBoardMode';

function Wrapper() {
  const [mode, setMode, toggle] = useBoardMode('test.boardMode', 'pyramid');
  return (
    <div>
      <span id="mode">{mode}</span>
      <button id="toggle" onClick={toggle}>toggle</button>
      <button id="stacked" onClick={() => setMode('stacked')}>stacked</button>
    </div>
  );
}

describe('useBoardMode hook', () => {
  beforeEach(() => {
    try { localStorage.removeItem('test.boardMode'); } catch {}
    document.body.innerHTML = '<div id="root"></div>';
  });

  it('initializes from default and persists changes', async () => {
    const rootEl = document.getElementById('root')!;
    const root = createRoot(rootEl);
    await act(async () => {
      root.render(<Wrapper />);
    });

    const modeSpan = () => document.getElementById('mode')!.textContent;
    expect(modeSpan()).toBe('pyramid');

    // Toggle to stacked
    await act(async () => {
      document.getElementById('toggle')!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(modeSpan()).toBe('stacked');
    expect(localStorage.getItem('test.boardMode')).toBe('stacked');

    // Force set to stacked (no change) and then toggle back
    await act(async () => {
      document.getElementById('stacked')!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(modeSpan()).toBe('stacked');
    await act(async () => {
      document.getElementById('toggle')!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(modeSpan()).toBe('pyramid');
    expect(localStorage.getItem('test.boardMode')).toBe('pyramid');
  });
});
