import { useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import type { RootState } from '../../store';
import Button from '../ui/Button';
import { aiSearchReset, aiSearchStarted, aiSearchProgress, aiSearchIter, aiSearchEnded } from '../../store/gameSlice';
import { store } from '../../store';
import { findBestMove } from '../../ai/search';

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
        </div>
        <div className="rounded-md border border-neutral-800/80 bg-neutral-900/60 p-2">
          <Stat label="Nodos" value={ai?.nodesVisited ?? 0} />
          <Stat label="Profundidad" value={ai?.depthReached ?? 0} />
          <Stat label="Score" value={typeof ai?.lastScore === 'number' ? ai.lastScore : '-'} />
          <Stat label="Inicio" value={ai?.startedAt ? new Date(ai.startedAt).toLocaleTimeString() : '-'} />
          <Stat label="Hace" value={startedAgo} />
          <Stat label="Duración última" value={typeof ai?.lastDurationMs === 'number' ? `${Math.round(ai.lastDurationMs)} ms` : '-'} />
        </div>
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
            // Stream metrics during a short bench search without moving
            dispatch(aiSearchStarted(Date.now()));
            await findBestMove(gs, {
              maxDepth: 2,
              timeLimitMs: 200,
              onProgress: (ev) => {
                if (ev.type === 'progress') dispatch(aiSearchProgress(ev.nodesVisited));
                else if (ev.type === 'iter') dispatch(aiSearchIter({ depth: ev.depth, score: ev.score }));
                else if (ev.type === 'end') dispatch(aiSearchEnded({ durationMs: ev.durationMs, depthReached: ev.depthReached, score: ev.score, nodesVisited: ev.nodesVisited }));
              },
            });
          }}
          title="Ejecuta una búsqueda corta (200ms, profundidad 2) para verificar que la IA progresa"
        >
          Probar búsqueda (bench)
        </Button>
      </div>
    </div>
  );
}

