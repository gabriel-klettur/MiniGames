import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';

// Make RAF immediate for these tests
if (!(globalThis as any).requestAnimationFrame) {
  (globalThis as any).requestAnimationFrame = (cb: FrameRequestCallback) => setTimeout(() => cb(performance.now()), 0) as unknown as number;
}

function getCurrent(): 'L' | 'D' | null {
  const img = document.querySelector('.piece--current img') as HTMLImageElement | null;
  if (!img) return null;
  const alt = img.getAttribute('alt') || '';
  if (alt.includes('Oscuras') || alt.includes('(D)')) return 'D';
  if (alt.includes('Claras') || alt.includes('(L)')) return 'L';
  return null;
}

// Mock FlyingPiece to immediately call onDone on mount (avoid timing/animation complexity)
vi.mock('./components/FlyingPiece', () => {
  return {
    __esModule: true,
    default: ({ onDone }: { onDone: () => void }) => {
      // call onDone in a microtask to simulate async end of animation
      queueMicrotask(() => onDone());
      return null as any;
    },
  };
});

import App from './App';

function queryCell(key: string): HTMLButtonElement {
  const el = document.querySelector(`button[data-poskey="${key}"]`) as HTMLButtonElement | null;
  if (!el) throw new Error(`cell ${key} not found`);
  return el;
}

function getReserves(): { L: number; D: number } {
  // InfoPanel shows two reserve-count spans in order: L then D
  const spans = Array.from(document.querySelectorAll('.reserve-count')) as HTMLSpanElement[];
  const L = spans[0] ? parseInt(spans[0].textContent || '0', 10) : NaN;
  const D = spans[1] ? parseInt(spans[1].textContent || '0', 10) : NaN;
  return { L, D };
}

async function clickCell(key: string) {
  await act(async () => {
    queryCell(key).dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await new Promise((r) => setTimeout(r, 0));
  });
}

async function waitUntil(predicate: () => boolean, timeoutMs = 1500) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (predicate()) return;
    await new Promise((r) => setTimeout(r, 10));
  }
  throw new Error('waitUntil: timeout');
}

describe('App integration: place, recover, finish', () => {
  beforeEach(() => {
    // Clean DOM and localStorage to avoid persisted states interfering
    document.body.innerHTML = '<div id="root"></div>';
    try {
      for (const k of Object.keys(localStorage)) {
        if (k.startsWith('pylos.')) localStorage.removeItem(k);
      }
    } catch {}
  });

  it('allows placing pieces, triggers recover on 2x2, recovers one, and finishes', async () => {
    const root = createRoot(document.getElementById('root')!);
    await act(async () => { root.render(<App />); });

    const initial = getReserves();
    expect(Number.isFinite(initial.L)).toBe(true);
    expect(Number.isFinite(initial.D)).toBe(true);

    // Plan: L places at 0-0-0; D far at 0-3-3; L at 0-0-1; D far at 0-3-2; L at 0-1-0; D far; L at 0-1-1 -> square and recover
    await clickCell('0-0-0'); // L
    await waitUntil(() => getReserves().L === initial.L - 1);
    let after = getReserves();
    expect(after.L).toBe(initial.L - 1);
    // Allow any queued microtasks (FlyingPiece onDone) to flush and clear 'flying'
    await act(async () => { await new Promise((r) => setTimeout(r, 0)); });

    // Ensure it's D's turn before clicking
    await waitUntil(() => getCurrent() === 'D');
    await clickCell('0-3-3'); // D elsewhere
    await waitUntil(() => getReserves().D === initial.D - 1);
    after = getReserves();
    expect(after.D).toBe(initial.D - 1);
    await act(async () => { await new Promise((r) => setTimeout(r, 0)); });

    await clickCell('0-0-1'); // L
    await clickCell('0-3-2'); // D
    await clickCell('0-1-0'); // L
    await clickCell('0-3-1'); // D

    // This move completes L square -> should enter recover phase
    await clickCell('0-1-1'); // L completes 2x2

    // Wait for finish recovery button to appear
    await waitUntil(() => !!document.querySelector('button.finish-recovery'));
    const finishBtn = document.querySelector('button.finish-recovery') as HTMLButtonElement | null;
    expect(finishBtn).toBeTruthy();

    // Recover one L piece from the formed square (free base piece)
    await clickCell('0-0-0');

    // Reserves L should increase by 1 relative to before recover
    const afterRecover = getReserves();
    // We placed 4 L pieces; L reserves should be initial.L - 4, after one recover initial.L - 3
    expect(afterRecover.L).toBe(initial.L - 3);

    // Finish recovery
    await act(async () => {
      finishBtn!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await new Promise((r) => setTimeout(r, 0));
    });

    // Recovery finished: finish button disappears
    await waitUntil(() => !document.querySelector('button.finish-recovery'));
    const finishGone = document.querySelector('button.finish-recovery');
    expect(finishGone).toBeNull();
  });
});
