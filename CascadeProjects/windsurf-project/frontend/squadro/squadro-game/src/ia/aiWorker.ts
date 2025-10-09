import { findBestMove, type SearchOptions, type SearchEvent } from './search';
import type { EngineOptions } from './search/types';
import type { GameState } from '../game/types';
import { movePiece as applyMoveRules } from '../game/rules';

// Messages from main thread
interface RunMessage {
  type: 'run';
  state: GameState;
  opts: { maxDepth: number; timeLimitMs: number; rootMoves?: string[]; forcedFirstMove?: string; engine?: EngineOptions };
}

// Messages to main thread
interface SearchEventMessage {
  type: 'search_event';
  ev: SearchEvent;
}

interface ResultMessage {
  type: 'result';
  moveId: string | null;
  score: number;
  depthReached: number;
  engineStats?: any;
}

self.onmessage = async (e: MessageEvent) => {
  const data = e.data as RunMessage | { type: 'noop' };
  if (!data || data.type !== 'run') return;

  const { state, opts } = data;

  let workingState = state;
  let adjustDepth = 0;
  let forcedMoveId: string | null = null;
  if (opts.forcedFirstMove) {
    forcedMoveId = opts.forcedFirstMove;
    // Deep clone minimal state for applying the forced move
    workingState = JSON.parse(JSON.stringify(state)) as GameState;
    applyMoveRules(workingState, forcedMoveId);
    adjustDepth = 1;
  }

  const options: SearchOptions = {
    maxDepth: Math.max(0, opts.maxDepth - adjustDepth),
    timeLimitMs: opts.timeLimitMs,
    onProgress: (ev) => {
      const msg: SearchEventMessage = { type: 'search_event', ev };
      // eslint-disable-next-line no-restricted-globals
      self.postMessage(msg);
    },
    rootMoves: opts.rootMoves,
    engine: opts.engine,
  };

  const best = await findBestMove(workingState, options);
  const res: ResultMessage = {
    type: 'result',
    moveId: forcedMoveId ?? best.moveId,
    score: forcedMoveId ? -best.score : best.score,
    depthReached: best.depthReached + adjustDepth,
    engineStats: best.engineStats,
  };
  // eslint-disable-next-line no-restricted-globals
  self.postMessage(res);
};
