/// <reference lib="webworker" />

// IA Web Worker: ejecuta la búsqueda fuera del hilo principal.
// Vite: se carga con new Worker(new URL('./aiWorker.ts', import.meta.url), { type: 'module' })

import type { GameState, Player } from '../game/types.ts';
import type { SearchParams, SearchResult } from './types.ts';
import { searchBestMove } from './minimax.ts';

interface SearchMessage {
  id: string;
  type: 'search';
  payload: { state: GameState; params: SearchParams; rootPlayer: Player; budgetMs?: number };
}

interface ResultMessage {
  id: string;
  type: 'result';
  payload: SearchResult;
}

interface ErrorMessage {
  id: string;
  type: 'error';
  payload: { message: string };
}

declare const self: DedicatedWorkerGlobalScope;

self.onmessage = (ev: MessageEvent<SearchMessage>) => {
  const msg = ev.data;
  if (!msg || msg.type !== 'search') {
    const err: ErrorMessage = { id: msg?.id ?? '0', type: 'error', payload: { message: 'Mensaje inválido' } };
    self.postMessage(err);
    return;
  }
  try {
    const { state, params, rootPlayer, budgetMs } = msg.payload;
    const p = { ...params };
    if ((p.deadlineMs === undefined || p.deadlineMs === null) && typeof budgetMs === 'number') {
      p.deadlineMs = performance.now() + Math.max(0, budgetMs);
    }
    const result = searchBestMove(state, p, rootPlayer);
    const out: ResultMessage = { id: msg.id, type: 'result', payload: result };
    self.postMessage(out);
  } catch (e: any) {
    const err: ErrorMessage = { id: msg.id, type: 'error', payload: { message: String(e?.message ?? e) } };
    self.postMessage(err);
  }
};
