import { createInitialState } from '../game/pieces';
import type { GameState } from '../game/types';
import { applyMove } from '../ia/moves';
import { findBestMove } from '../ia/search';
import type { EngineOptions } from '../ia/search/types';
import { add as tbAdd, clear as tbClear } from '../ia/tablebase';
import { hashState } from '../ia/hash';

export type SuiteCase = {
  name: string;
  moves: string[];
  depth?: number;
  timeMs: number;
  engine?: Partial<EngineOptions>;
  tbEntry?: { value: 'win' | 'loss' | 'draw'; bestMove?: string; pv?: string[]; score?: number };
  expect: {
    minDepth?: number;
    bestMoveNonNull?: boolean;
    bestMoveIs?: string;
    bestMoveOneOf?: string[];
    pvPrefix?: string[];
    scoreAtLeast?: number;
    scoreAtMost?: number;
  };
};

export type SuiteResult = {
  total: number;
  passed: number;
  failed: number;
  details: Array<{
    name: string;
    ok: boolean;
    depthReached: number;
    score: number;
    moveId: string | null;
    message?: string;
  }>;
};

async function buildState(moves: string[]): Promise<GameState> {
  let s = createInitialState();
  for (const m of moves) {
    s = applyMove(s, m);
  }
  return s;
}

function checkExpect(depthReached: number, moveId: string | null, score: number, pv: string[] | null, expect: SuiteCase['expect']): { ok: boolean; message?: string } {
  if (typeof expect.minDepth === 'number' && depthReached < expect.minDepth) {
    return { ok: false, message: `depth ${depthReached} < minDepth ${expect.minDepth}` };
  }
  if (expect.bestMoveNonNull && !moveId) {
    return { ok: false, message: 'bestMove is null' };
  }
  if (expect.bestMoveIs && moveId !== expect.bestMoveIs) {
    return { ok: false, message: `bestMove ${moveId ?? 'null'} != ${expect.bestMoveIs}` };
  }
  if (expect.bestMoveOneOf && expect.bestMoveOneOf.length > 0) {
    if (!moveId || !expect.bestMoveOneOf.includes(moveId)) {
      return { ok: false, message: `bestMove ${moveId ?? 'null'} not in [${expect.bestMoveOneOf.join(',')}]` };
    }
  }
  if (typeof expect.scoreAtLeast === 'number' && !(score >= expect.scoreAtLeast)) {
    return { ok: false, message: `score ${score} < ${expect.scoreAtLeast}` };
  }
  if (typeof expect.scoreAtMost === 'number' && !(score <= expect.scoreAtMost)) {
    return { ok: false, message: `score ${score} > ${expect.scoreAtMost}` };
  }
  if (expect.pvPrefix && expect.pvPrefix.length > 0) {
    const arr = pv || [];
    const ok = expect.pvPrefix.every((m, i) => arr[i] === m);
    if (!ok) return { ok: false, message: `pvPrefix mismatch: got [${arr.slice(0, expect.pvPrefix.length).join(',')}], want [${expect.pvPrefix.join(',')}]` };
  }
  return { ok: true };
}

export async function runSuite(): Promise<SuiteResult> {
  const cases: SuiteCase[] = (await import('./positions.json')).default as any;
  const details: SuiteResult['details'] = [];
  for (const c of cases) {
    const root = await buildState(c.moves);
    // Reset tablebase and optionally preload an entry for this root
    tbClear();
    if (c.tbEntry) {
      const key = hashState(root);
      tbAdd(key, { value: c.tbEntry.value, bestMove: c.tbEntry.bestMove, pv: c.tbEntry.pv, score: c.tbEntry.score });
    }
    let lastPV: string[] | null = null;
    const engineArg: Partial<EngineOptions> = { ...(c.engine || {}) };
    if (c.tbEntry) engineArg.enableTablebase = true;
    const res = await findBestMove(root, {
      maxDepth: Math.max(1, typeof c.depth === 'number' ? c.depth : 4),
      timeLimitMs: Math.max(200, c.timeMs),
      onProgress: (ev) => {
        if (ev.type === 'iter' && Array.isArray(ev.pv)) {
          lastPV = ev.pv;
        }
      },
      engine: (engineArg as any) || undefined,
    });
    const chk = checkExpect(res.depthReached, res.moveId, res.score, lastPV, c.expect);
    details.push({
      name: c.name,
      ok: chk.ok,
      depthReached: res.depthReached,
      score: res.score,
      moveId: res.moveId,
      message: chk.message,
    });
  }
  const passed = details.filter(d => d.ok).length;
  const failed = details.length - passed;
  return { total: details.length, passed, failed, details };
}
