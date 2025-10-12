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
  repeat?: number;
  allowFailuresPct?: number;
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
    const runs = Math.max(1, Math.floor(c.repeat ?? 1));
    const allowPct = Math.max(0, Math.min(1, c.allowFailuresPct ?? 0));
    const maxAllowed = Math.floor(allowPct * runs);
    let fails = 0;
    let bestDepth = 0;
    let lastScore = 0;
    let lastMoveId: string | null = null;
    let lastMsg: string | undefined = undefined;
    for (let i = 0; i < runs; i++) {
      tbClear();
      if (c.tbEntry) {
        const key = hashState(root);
        tbAdd(key, { value: c.tbEntry.value, bestMove: c.tbEntry.bestMove, pv: c.tbEntry.pv, score: c.tbEntry.score });
      }
      let lastPV: string[] | null = null;
      const engineArg: Partial<EngineOptions> = {
        ...(c.engine || {}),
        orderingJitterEps: 0,
        enableAdaptiveTime: false,
        enableRootParallel: false,
        workers: 1,
      };
      if (c.tbEntry) engineArg.enableTablebase = true;
      const res = await findBestMove(root, {
        maxDepth: Math.max(1, typeof c.depth === 'number' ? c.depth : 4),
        timeLimitMs: Math.max(200, c.timeMs),
        maxNodes: (c as any).maxNodes,
        onProgress: (ev) => {
          if (ev.type === 'iter' && Array.isArray(ev.pv)) {
            lastPV = ev.pv;
          }
        },
        engine: (engineArg as any) || undefined,
      });
      const chk = checkExpect(res.depthReached, res.moveId, res.score, lastPV, c.expect);
      if (!chk.ok) fails += 1;
      if (res.depthReached > bestDepth) bestDepth = res.depthReached;
      lastScore = res.score;
      lastMoveId = res.moveId;
      lastMsg = chk.message;
    }
    const ok = fails <= maxAllowed;
    const msg = runs > 1 ? (ok ? undefined : `flaky ${fails}/${runs}`) : lastMsg;
    details.push({
      name: c.name,
      ok,
      depthReached: bestDepth,
      score: lastScore,
      moveId: lastMoveId,
      message: msg,
    });
  }
  const passed = details.filter(d => d.ok).length;
  const failed = details.length - passed;
  return { total: details.length, passed, failed, details };
}
