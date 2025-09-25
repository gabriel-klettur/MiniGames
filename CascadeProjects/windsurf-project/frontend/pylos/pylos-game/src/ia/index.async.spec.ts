import { describe, it, expect } from 'vitest';
import { computeBestMoveAsync } from './index';
import { initialState } from '../game/rules';

// Mock Worker implementation for computeBestMoveAsync
class MockWorker {
  onmessage: ((ev: MessageEvent) => any) | null = null;
  private listeners: { [type: string]: Array<(ev: MessageEvent) => any> } = {};
  public lastPost: any = null;

  constructor(_: any, __?: any) {}
  addEventListener(type: string, cb: (ev: MessageEvent) => any) {
    (this.listeners[type] ||= []).push(cb);
  }
  removeEventListener(type: string, cb: (ev: MessageEvent) => any) {
    this.listeners[type] = (this.listeners[type] || []).filter((f) => f !== cb);
  }
  postMessage(msg: any) {
    this.lastPost = msg;
    // immediately simulate a result after a short microtask
    queueMicrotask(() => {
      const result = {
        type: 'RESULT',
        bestMove: { kind: 'place', dest: { level: 0, row: 0, col: 0 } },
        score: 0,
        depthReached: 1,
        pv: [{ kind: 'place', dest: { level: 0, row: 0, col: 0 } }],
        rootMoves: [{ move: { kind: 'place', dest: { level: 0, row: 0, col: 0 } }, score: 0 }],
        nodes: 1,
        elapsedMs: 1,
        nps: 1000,
      } as any;
      (this.listeners['message'] || []).forEach((cb) => cb({ data: result } as MessageEvent));
    });
  }
}

// Attach mock Worker
(globalThis as any).Worker = MockWorker as any;

describe('ia/index.ts – computeBestMoveAsync', () => {
  it('returns a move and metrics via mocked Worker', async () => {
    const s = initialState();
    const res = await computeBestMoveAsync(s, { depth: 2, timeMs: 100 });
    expect(res.move).toBeTruthy();
    expect(res.nodes).toBeGreaterThanOrEqual(1);
    expect(res.pv.length).toBeGreaterThanOrEqual(1);
  });

  it('supports AbortController by rejecting with AbortError', async () => {
    const s = initialState();
    const ac = new AbortController();
    const p = computeBestMoveAsync(s, { depth: 2, timeMs: 1000, signal: ac.signal });
    ac.abort();
    await expect(p).rejects.toThrowError(/Aborted/);
  });
});
