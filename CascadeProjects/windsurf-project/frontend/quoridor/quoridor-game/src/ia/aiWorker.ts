/// <reference lib="webworker" />

// IA Web Worker: ejecuta la búsqueda fuera del hilo principal.
// Vite: se carga con new Worker(new URL('./aiWorker.ts', import.meta.url), { type: 'module' })

import type { GameState, Player } from '../game/types.ts';
import type { SearchParams, SearchResult, TraceEvent, TraceConfig } from './types.ts';
import { searchBestMove } from './minimax.ts';

interface SearchMessage {
  id: string;
  type: 'search';
  payload: { state: GameState; params: SearchParams; rootPlayer: Player; budgetMs?: number; traceConfig?: TraceConfig };
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

interface TraceMessage {
  id: string;
  type: 'trace';
  payload: { events: TraceEvent[] };
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
    const { state, params, rootPlayer, budgetMs, traceConfig } = msg.payload;
    const p: SearchParams = { ...params };
    if ((p.deadlineMs === undefined || p.deadlineMs === null) && typeof budgetMs === 'number') {
      p.deadlineMs = performance.now() + Math.max(0, budgetMs);
    }
    // Tracing: batch and stream to main thread
    const BATCH_SIZE = 250;
    let batch: TraceEvent[] = [];
    const flush = () => {
      if (batch.length === 0) return;
      const out: TraceMessage = { id: msg.id, type: 'trace', payload: { events: batch } };
      self.postMessage(out);
      batch = [];
    };
    p.traceConfig = traceConfig;
    p.onTrace = (ev: TraceEvent | TraceEvent[]) => {
      if (Array.isArray(ev)) {
        batch.push(...ev);
      } else {
        batch.push(ev);
      }
      if (batch.length >= BATCH_SIZE) flush();
    };
    const result = searchBestMove(state, p, rootPlayer);
    // Flush remaining trace events, if any
    flush();
    const out: ResultMessage = { id: msg.id, type: 'result', payload: result };
    self.postMessage(out);
  } catch (e: any) {
    const err: ErrorMessage = { id: msg.id, type: 'error', payload: { message: String(e?.message ?? e) } };
    self.postMessage(err);
  }
};
