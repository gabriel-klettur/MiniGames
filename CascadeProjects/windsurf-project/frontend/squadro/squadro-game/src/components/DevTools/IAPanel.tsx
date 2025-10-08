import { useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import type { RootState } from '../../store';
import Button from '../ui/Button';
import ToggleSwitch from '../ui/ToggleSwitch';
import { aiSearchReset, aiSearchStarted, aiSearchProgress, aiSearchIter, aiSearchEnded, setAIUseWorkers } from '../../store/gameSlice';
import { store } from '../../store';
import { findBestMove } from '../../ia/search';

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-1 border-b border-neutral-800/60 last:border-b-0">
      <div className="text-[11px] text-neutral-400 mr-3">{label}</div>
      <div className="text-xs text-neutral-100 font-mono tabular-nums">{value}</div>
    </div>
  );
}

export default function AIDiagnosticsPanel() {
  const dispatch = useAppDispatch();
  const { ai, turn } = useAppSelector((s: RootState) => s.game);

  const startedAgo = useMemo(() => {
    if (!ai?.startedAt) return '-';
    const delta = Date.now() - ai.startedAt;
    return `${Math.max(0, Math.round(delta))} ms ago`;
  }, [ai?.startedAt]);

  const running = !!ai?.busy;

  // Derived diagnostics
  const targetDepth = ai?.difficulty;
  // En VS IA, el límite de tiempo del motor es ilimitado (Infinity)
  const timeLimitLabel = 'Ilimitado';

  const formattedDuration = useMemo(() => {
    const ms = ai?.lastDurationMs;
    if (typeof ms !== 'number') return '-';
    const totalSec = Math.round(ms / 1000);
    if (totalSec <= 59) return `${totalSec} s`;
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }, [ai?.lastDurationMs]);

  return (
    <div className="mt-3 w-full rounded-lg border border-neutral-800 bg-neutral-900/70 p-3">
      <h3 className="text-xs font-semibold text-neutral-300 mb-2">IA • Diagnóstico</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="rounded-md border border-neutral-800/80 bg-neutral-900/60 p-2">
          <Stat label="Estado" value={
            <span className={`inline-flex items-center gap-2 ${running ? 'text-emerald-300' : 'text-neutral-300'}`}>
              <span className={`inline-block w-2 h-2 rounded-full ${running ? 'bg-emerald-400' : 'bg-neutral-500'}`} />
              {running ? 'Pensando' : 'Inactivo'}
            </span>
          } />
          <Stat label="Turno" value={turn} />
          <Stat label="Lado IA" value={ai?.aiSide ?? '-'} />
          <Stat label="Dificultad" value={ai?.difficulty ?? '-'} />
          <Stat label="Velocidad" value={ai?.speed ?? '-'} />
          <Stat label="Modo tiempo" value={ai?.timeMode ?? '-'} />
          {ai?.timeMode === 'manual' && <Stat label="Segundos" value={ai?.timeSeconds ?? '-'} />}
          <Stat label="Profundidad objetivo" value={typeof targetDepth === 'number' ? targetDepth : '-'} />
          <Stat label="Límite de tiempo" value={timeLimitLabel} />
        </div>
        <div className="rounded-md border border-neutral-800/80 bg-neutral-900/60 p-2">
          <Stat label="Nodos" value={ai?.nodesVisited ?? 0} />
          <Stat label="Profundidad" value={ai?.depthReached ?? 0} />
          <Stat label="Score" value={typeof ai?.lastScore === 'number' ? ai.lastScore : '-'} />
          <Stat label="Inicio" value={ai?.startedAt ? new Date(ai.startedAt).toLocaleTimeString() : '-'} />
          <Stat label="Hace" value={startedAgo} />
          <Stat label="Duración última" value={formattedDuration} />
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <div className="text-xs text-neutral-300">Usar Workers</div>
        <ToggleSwitch
          checked={ai?.useWorkers !== false}
          onChange={(v) => dispatch(setAIUseWorkers(v))}
          offLabel="Off"
          onLabel="On"
        />
      </div>
      <div className="mt-3 flex items-center gap-2">
        <Button size="sm" variant="primary" onClick={() => dispatch(aiSearchReset())}>
          Reset métricas
        </Button>
        <Button
          size="sm"
          variant="neutral"
          onClick={async () => {
            const state: RootState = store.getState();
            const gs = state.game;
            dispatch(aiSearchStarted(Date.now()));
            if (gs.ai?.useWorkers === false) {
              // Run bench on main thread
              await findBestMove(gs, {
                maxDepth: 2,
                timeLimitMs: 200,
                onProgress: (ev) => {
                  if (ev.type === 'progress') dispatch(aiSearchProgress(ev.nodesVisited));
                  else if (ev.type === 'iter') dispatch(aiSearchIter({ depth: ev.depth, score: ev.score }));
                  else if (ev.type === 'end') dispatch(aiSearchEnded({ durationMs: ev.durationMs, depthReached: ev.depthReached, score: ev.score, nodesVisited: ev.nodesVisited }));
                },
              });
            } else {
              // Run bench in worker
              const w = new Worker(new URL('../../ai/aiWorker.ts', import.meta.url), { type: 'module' });
              w.onmessage = (msg: MessageEvent) => {
                const data = msg.data as any;
                if (data?.type === 'search_event') {
                  const ev = data.ev as any;
                  if (ev.type === 'progress') dispatch(aiSearchProgress(ev.nodesVisited));
                  else if (ev.type === 'iter') dispatch(aiSearchIter({ depth: ev.depth, score: ev.score }));
                  else if (ev.type === 'end') dispatch(aiSearchEnded({ durationMs: ev.durationMs, depthReached: ev.depthReached, score: ev.score, nodesVisited: ev.nodesVisited }));
                } else if (data?.type === 'result') {
                  // Bench doesn't move pieces; just terminate
                  try { w.terminate(); } catch {}
                }
              };
              w.postMessage({ type: 'run', state: gs, opts: { maxDepth: 2, timeLimitMs: 200 } });
            }
          }}
          title="Ejecuta una búsqueda corta (200ms, profundidad 2) para verificar que la IA progresa"
        >
          Probar búsqueda (bench)
        </Button>
        <Button
          size="sm"
          variant="neutral"
          className="bg-red-800 text-red-100 border-red-600 hover:bg-red-700 focus:ring-red-400/30"
          onClick={() => { try { (window as any).__squadroCancelAI?.(); } catch {} }}
          disabled={!ai?.busy}
          title="Cancelar la búsqueda de IA en curso"
        >
          Cancelar búsqueda
        </Button>
      </div>
    </div>
  );
}

