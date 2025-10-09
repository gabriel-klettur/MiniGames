import { useEffect, useRef, useState } from 'react';
import Board from './components/Board/Board';
import HeaderPanel from './components/HeaderPanel/HeaderPanel';
import IAUserPanel from './components/IAUserPanel/IAUserPanel.tsx';
import InfoPanel from './components/InfoPanel';
import DevToolsPanel from './components/DevTools/DevToolsPanel';
import FootPanel from './components/FootPanel';
import './App.css';
import { useAppDispatch, useAppSelector } from './store/hooks';
import type { RootState } from './store';
import { store } from './store';
import { movePiece, setAIBusy, aiSearchStarted, aiSearchProgress, aiSearchIter, aiSearchEnded, setAIDifficulty, setAIEnabled, setAISide } from './store/gameSlice';
import { movePiece as movePieceRules } from './game/rules';
import { findBestMove } from './ia/search';
import { getWorkers, resetPool } from './ia/workerPool';

function App() {
  const dispatch = useAppDispatch();
  const { ai, winner, turn } = useAppSelector((s: RootState) => s.game);
  const timerRef = useRef<number | null>(null);
  const workersRef = useRef<Worker[] | null>(null);
  const [showDev, setShowDev] = useState<boolean>(false);
  const [showIA, setShowIA] = useState<boolean>(false);

  // Advanced autoplay for AI side using time-bounded search
  useEffect(() => {
    let cancelled = false;
    // cleanup any pending
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (workersRef.current) {
      resetPool();
      workersRef.current = null;
    }
    // Clear global cancel on mount of new effect
    (window as any).__squadroCancelAI = undefined;
    if (!ai?.enabled) return;
    if (winner) return;
    if (turn !== ai.aiSide) return;
    if (ai.busy) return;

    const computeTime = () => {
      const a = ai;
      if (!a) return Infinity;
      // Manual: respetar segundos configurados; 0 => ilimitado
      if (a.timeMode === 'manual') {
        const secs = Math.max(0, Math.min(60, a.timeSeconds ?? 0));
        return secs === 0 ? Infinity : secs * 1000;
      }
      // Auto: usar parámetros avanzados si existen; si no, derivar de speed/difficulty
      const d = Math.max(1, Math.min(20, a.difficulty ?? 3));
      const base = (typeof a.aiTimeBaseMs === 'number') ? a.aiTimeBaseMs : (a.speed === 'rapido' ? 1200 : a.speed === 'lento' ? 5000 : 2500);
      const perMove = (typeof a.aiTimePerMoveMs === 'number') ? a.aiTimePerMoveMs : 300; // default bonus per depth unit
      const exponent = (typeof a.aiTimeExponent === 'number') ? a.aiTimeExponent : 1.0;
      const raw = base + perMove * Math.max(0, d - 3) ** Math.max(0.5, exponent);
      const minMs = (typeof a.aiTimeMinMs === 'number') ? a.aiTimeMinMs : 800;
      const maxMs = (typeof a.aiTimeMaxMs === 'number') ? a.aiTimeMaxMs : 8000;
      return Math.max(minMs, Math.min(maxMs, raw));
    };

    const go = async () => {
      dispatch(setAIBusy(true));
      const startAt = Date.now();
      dispatch(aiSearchStarted(startAt));
      const state: RootState = store.getState();
      const gs = state.game;

      // Single-thread fallback if workers are disabled
      if (ai?.useWorkers === false) {
        try {
          // Engine options derived from AI state
          const engineOpts = {
            enableTT: ai.enableTT !== false,
            enableKillers: ai.enableKillers !== false,
            enableHistory: ai.enableHistory !== false,
            enablePVS: ai.enablePVS !== false,
            enableLMR: ai.enableLMR !== false,
            lmrMinDepth: typeof ai.lmrMinDepth === 'number' ? ai.lmrMinDepth : 3,
            lmrLateMoveIdx: typeof ai.lmrLateMoveIdx === 'number' ? ai.lmrLateMoveIdx : 3,
            lmrReduction: typeof ai.lmrReduction === 'number' ? ai.lmrReduction : 1,
          } as const;

          const res = await findBestMove(gs, {
            maxDepth: ai.difficulty,
            timeLimitMs: computeTime(),
            onProgress: (ev) => {
              if (ev.type === 'progress') dispatch(aiSearchProgress(ev.nodesVisited));
              else if (ev.type === 'iter') dispatch(aiSearchIter({ depth: ev.depth, score: ev.score }));
            },
            engine: engineOpts,
          });
          const durationMs = Date.now() - startAt;
          dispatch(aiSearchEnded({ durationMs, depthReached: res.depthReached, score: res.score, nodesVisited: (state.game.ai?.nodesVisited) || 0, engineStats: res.engineStats }));
          if (!cancelled && res.moveId) dispatch(movePiece(res.moveId));
        } finally {
          if (!cancelled) dispatch(setAIBusy(false));
        }
        return;
      }

      // Compute root moves
      const allRootMoves = gs.pieces.filter((p) => p.owner === gs.turn && p.state !== 'retirada').map((p) => p.id);
      const hc = (typeof navigator !== 'undefined' && (navigator as any).hardwareConcurrency) ? (navigator as any).hardwareConcurrency as number : 4;
      const desiredWorkers = Math.max(1, Math.min(hc, 8)); // clamp to avoid excessive workers
      let tasks: Array<{ forcedFirstMove?: string; rootMoves?: string[] }>; 
      // Helper to list moves for a given state
      const listMoves = (state: typeof gs) => state.pieces.filter((p) => p.owner === state.turn && p.state !== 'retirada').map((p) => p.id);

      if (allRootMoves.length >= desiredWorkers) {
        // Simple root split
        const buckets: string[][] = Array.from({ length: desiredWorkers }, () => []);
        for (let i = 0; i < allRootMoves.length; i++) {
          buckets[i % desiredWorkers].push(allRootMoves[i]);
        }
        tasks = buckets.filter(b => b.length > 0).map((b) => ({ rootMoves: b }));
      } else {
        // Deep split: split second ply among multiple workers
        // 1) For each root move, compute its child moves
        const childMovesPerRoot: string[][] = [];
        for (const rm of allRootMoves) {
          const clone = JSON.parse(JSON.stringify(gs)) as typeof gs;
          movePieceRules(clone, rm);
          childMovesPerRoot.push(listMoves(clone));
        }
        // 2) Decide how many buckets per root (K_i), starting with 1 each
        const R = Math.max(1, allRootMoves.length);
        const K: number[] = Array(R).fill(1);
        let remaining = Math.max(0, desiredWorkers - R);
        // Greedy: always split the root with the largest current bucket size
        while (remaining > 0) {
          let bestIdx = 0;
          let bestScore = -Infinity;
          for (let i = 0; i < R; i++) {
            const size = childMovesPerRoot[i].length;
            const parts = K[i];
            const score = size / parts; // average size per bucket
            if (score > bestScore) { bestScore = score; bestIdx = i; }
          }
          K[bestIdx] += 1;
          remaining -= 1;
        }
        // 3) Build tasks: for each root i, split its child moves into K[i] buckets
        tasks = [];
        for (let i = 0; i < R; i++) {
          const cm = childMovesPerRoot[i];
          const k = Math.max(1, K[i]);
          const buckets: string[][] = Array.from({ length: k }, () => []);
          for (let j = 0; j < cm.length; j++) {
            buckets[j % k].push(cm[j]);
          }
          for (const b of buckets) {
            if (b.length === 0) continue;
            tasks.push({ forcedFirstMove: allRootMoves[i], rootMoves: b });
          }
        }
        if (tasks.length === 0) {
          // Fallback: at least one task per root even if no child moves
          tasks = allRootMoves.map((rm) => ({ forcedFirstMove: rm }));
        }
      }

      const workerCount = tasks.length;
      const workers: Worker[] = getWorkers(workerCount);
      workersRef.current = workers;
      const lastNodes: number[] = Array(workerCount).fill(0);
      let maxDepthIter = 0;
      let bestIterScore = -Infinity;
      let completed = 0;
      let finalized = false;
      let bestResult: { score: number; moveId: string | null; depthReached: number } | null = null;

      const aggregateNodes = () => lastNodes.reduce((a, b) => a + b, 0);

      // Expose global cancel that finalizes with current partial metrics
      (window as any).__squadroCancelAI = () => {
        if (finalized) return;
        finalized = true;
        const durationMs = Date.now() - startAt;
        const nodesVisited = aggregateNodes();
        const depthReached = bestResult ? Math.max(maxDepthIter, bestResult.depthReached) : maxDepthIter;
        dispatch(aiSearchEnded({ durationMs, depthReached, score: typeof bestResult?.score === 'number' ? bestResult!.score : -Infinity, nodesVisited }));
        for (const ww of workers) {
          try { ww.terminate(); } catch {}
        }
        workersRef.current = null;
        dispatch(setAIBusy(false));
      };

      for (let i = 0; i < workerCount; i++) {
        const w = workers[i];
        w.onmessage = (msg: MessageEvent) => {
          const data = msg.data as any;
          if (data?.type === 'search_event') {
            const ev = data.ev as any;
            if (ev.type === 'progress') {
              lastNodes[i] = ev.nodesVisited || 0;
              dispatch(aiSearchProgress(aggregateNodes()));
            } else if (ev.type === 'iter') {
              if (typeof ev.depth === 'number' && ev.depth > maxDepthIter) maxDepthIter = ev.depth;
              if (typeof ev.score === 'number' && ev.score > bestIterScore) bestIterScore = ev.score;
              dispatch(aiSearchIter({ depth: maxDepthIter, score: bestIterScore }));
            }
            // Ignore 'start' and 'end' events here to avoid multiple resets/ends
          } else if (data?.type === 'result') {
            if (finalized) return;
            completed++;
            if (!bestResult || data.score > bestResult.score) {
              bestResult = { score: data.score as number, moveId: data.moveId as string | null, depthReached: data.depthReached as number };
            }
            // Early cancel on forced outcome
            if (typeof data.score === 'number' && Math.abs(data.score) > 90000) {
              finalized = true;
              const durationMs = Date.now() - startAt;
              const nodesVisited = aggregateNodes();
              const depthReached = Math.max(maxDepthIter, data.depthReached as number);
              dispatch(aiSearchEnded({ durationMs, depthReached, score: data.score as number, nodesVisited, engineStats: (data as any).engineStats }));
              if (!cancelled && data.moveId) {
                dispatch(movePiece(data.moveId as string));
              }
              resetPool();
              workersRef.current = null;
              if (!cancelled) dispatch(setAIBusy(false));
              return;
            }
            if (completed >= workerCount) {
              // All workers finished
              const durationMs = Date.now() - startAt;
              const nodesVisited = aggregateNodes();
              const depthReached = bestResult ? Math.max(maxDepthIter, bestResult.depthReached) : maxDepthIter;
              dispatch(aiSearchEnded({ durationMs, depthReached, score: bestResult?.score ?? -Infinity, nodesVisited, engineStats: (data as any).engineStats }));
              if (!cancelled && bestResult && bestResult.moveId) {
                dispatch(movePiece(bestResult.moveId));
              }
              // Keep pool alive for next move
              workersRef.current = workers;
              if (!cancelled) dispatch(setAIBusy(false));
            }
          }
        };
        const t = tasks[i];
        const engineOpts = {
          enableTT: ai?.enableTT !== false,
          enableKillers: ai?.enableKillers !== false,
          enableHistory: ai?.enableHistory !== false,
          enablePVS: ai?.enablePVS !== false,
          enableLMR: ai?.enableLMR !== false,
          lmrMinDepth: typeof ai?.lmrMinDepth === 'number' ? ai!.lmrMinDepth : 3,
          lmrLateMoveIdx: typeof ai?.lmrLateMoveIdx === 'number' ? ai!.lmrLateMoveIdx : 3,
          lmrReduction: typeof ai?.lmrReduction === 'number' ? ai!.lmrReduction : 1,
        } as const;
        w.postMessage({ type: 'run', state: gs, opts: { maxDepth: ai.difficulty, timeLimitMs: computeTime(), rootMoves: t.rootMoves, forcedFirstMove: t.forcedFirstMove, engine: engineOpts } });
      }
    };

    // small defer to allow UI to render busy state
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      void go();
    }, 0);

    return () => {
      cancelled = true;
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      if (workersRef.current) {
        resetPool();
        workersRef.current = null;
      }
      (window as any).__squadroCancelAI = undefined;
    };
  }, [ai?.enabled, ai?.aiSide, ai?.speed, ai?.timeMode, ai?.timeSeconds, ai?.difficulty, turn, winner, dispatch]);

  return (
    <div className="min-h-screen bg-transparent text-gray-100 overflow-x-hidden">
      <div className="w-full px-[10px]">
        <HeaderPanel showIA={showIA} onToggleIA={() => setShowIA((v) => !v)} />
      </div>
      {/* Full-width play area with exact 10px side margins (no horizontal overflow) */}
      <div className="w-full px-[10px] flex flex-col gap-2 overflow-x-hidden">
        {/* InfoPanel above the board */}
        <div className=" p-1">
          <InfoPanel />
        </div>
        {/* IA user panel (toggleable from header) */}
        {showIA && (
          <div className="w-full px-[10px]">
            <IAUserPanel
              depth={ai?.difficulty ?? 3}
              onChangeDepth={(d) => dispatch(setAIDifficulty(d))}
              onAIMove={() => {
                // Ensure AI is enabled so the effect can run on its next turn
                if (!ai?.enabled) dispatch(setAIEnabled(true));
              }}
              disabled={!!winner}
              aiControlP1={!!(ai?.enabled && ai?.aiSide === 'Light')}
              aiControlP2={!!(ai?.enabled && ai?.aiSide === 'Dark')}
              onToggleAiControlP1={() => {
                const active = !!(ai?.enabled && ai?.aiSide === 'Light');
                if (active) {
                  dispatch(setAIEnabled(false));
                } else {
                  dispatch(setAISide('Light'));
                  dispatch(setAIEnabled(true));
                }
              }}
              onToggleAiControlP2={() => {
                const active = !!(ai?.enabled && ai?.aiSide === 'Dark');
                if (active) {
                  dispatch(setAIEnabled(false));
                } else {
                  dispatch(setAISide('Dark'));
                  dispatch(setAIEnabled(true));
                }
              }}
              busy={!!ai?.busy}
            />
          </div>
        )}
        <main className="w-full overflow-x-hidden">
          <Board />
        </main>
        {/* DevTools placed directly below the board (toggleable) */}
        {showDev && <DevToolsPanel />}
      </div>
      <footer className="w-full max-w-4xl">
        <FootPanel />
      </footer>
      {/* Floating Dev toggle button (bottom-right) */}
      <button
        onClick={() => setShowDev((v) => !v)}
        aria-pressed={showDev}
        aria-label="Alternar panel de desarrollo"
        title="Dev"
        className="chip-btn fixed bottom-4 right-4"
      >
        Dev
      </button>
    </div>
  );
}

export default App;
