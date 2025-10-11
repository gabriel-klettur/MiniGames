import { useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import type { RootState } from '../../store';
import Button from '../ui/Button';
import ToggleSwitch from '../ui/ToggleSwitch';
import { aiSearchReset, aiSearchStarted, aiSearchProgress, aiSearchIter, aiSearchEnded, setAIUseWorkers } from '../../store/gameSlice';
import { store } from '../../store';
import { findBestMove } from '../../ia/search';

function Stat({ label, value, title }: { label: string; value: React.ReactNode; title?: string }) {
  return (
    <div className="flex items-center justify-between py-1 border-b border-neutral-800/60 last:border-b-0">
      <div className="text-[11px] text-neutral-400 mr-3" title={title}>{label}</div>
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
      <h3 className="text-xs font-semibold text-neutral-300 mb-2" title="Panel de diagnóstico de IA — Muestra métricas de búsqueda (minimax/negamax con poda αβ), tiempo y estado. Ejemplo: verifica nodos, profundidad alcanzada y score para entender si las heurísticas y el orden de movimientos funcionan correctamente.">IA • Diagnóstico</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="rounded-md border border-neutral-800/80 bg-neutral-900/60 p-2">
          <Stat label="Estado" title="Estado — Inactivo o Pensando. Ejemplo: 'Pensando' cuando el motor está evaluando nodos; vuelve a 'Inactivo' al terminar o al cancelar." value={
            <span className={`inline-flex items-center gap-2 ${running ? 'text-emerald-300' : 'text-neutral-300'}`}>
              <span className={`inline-block w-2 h-2 rounded-full ${running ? 'bg-emerald-400' : 'bg-neutral-500'}`} />
              {running ? 'Pensando' : 'Inactivo'}
            </span>
          } />
          <Stat label="Turno" title="Turno — Quién mueve ahora (Light/Dark). Ejemplo: algunas heurísticas consideran la iniciativa (tempo) a favor del usuario al que le toca." value={turn} />
          <Stat label="Lado IA" title="Lado IA — Bando controlado por la IA (Light/Dark). Ejemplo: el signo del score suele ser relativo al usuario actual; verifica coherencia al alternar lados." value={ai?.aiSide ?? '-'} />
          <Stat label="Dificultad" title="Dificultad — Objetivo de profundidad (plies) para la búsqueda. Ejemplo: 5 ⇒ busca hasta 5 plies en iterativa, salvo recortes por tiempo." value={ai?.difficulty ?? '-'} />
          <Stat label="Modo tiempo" title="Modo tiempo — Auto: adaptativo/aspiration windows; Manual: límite duro en segundos. Ejemplo: Manual 10s capea cada jugada a 10 segundos." value={ai?.timeMode ?? '-'} />
          {ai?.timeMode === 'manual' && <Stat label="Segundos" title="Segundos — Límite por jugada en modo Manual. Ejemplo: 5s fuerza decisiones rápidas; 30s explora más nodos." value={ai?.timeSeconds ?? '-'} />}
          <Stat label="Profundidad objetivo" title="Profundidad objetivo — Límite de plies esperado (iterative deepening). Ejemplo: si el tiempo alcanza, puede superar el objetivo en la última iteración." value={typeof targetDepth === 'number' ? targetDepth : '-'} />
          <Stat label="Límite de tiempo" title="Límite de tiempo — En VS IA puede ser 'Ilimitado' (Infinity). Ejemplo: útil para pruebas de máxima profundidad sin restricción temporal." value={timeLimitLabel} />
        </div>
        <div className="rounded-md border border-neutral-800/80 bg-neutral-900/60 p-2">
          <Stat label="Nodos" title="Nodos — Total de posiciones evaluadas (visitas). Ejemplo: junto con duración puedes estimar NPS (nodos/seg) para comparar builds." value={ai?.nodesVisited ?? 0} />
          <Stat label="Profundidad" title="Profundidad — Ply máximo alcanzado en la última búsqueda. Ejemplo: verifica que LMR/Quiescence no impidan alcanzar la PV prevista." value={ai?.depthReached ?? 0} />
          <Stat label="Score" title="Score — Evaluación heurística; signo relativo al usuario actual. Ejemplo: positivo favorece al lado que mueve; compara con movimientos sugeridos." value={typeof ai?.lastScore === 'number' ? ai.lastScore : '-'} />
          <Stat label="Inicio" title="Inicio — Momento en que comenzó la última búsqueda. Útil para rastrear series de benchmarks." value={ai?.startedAt ? new Date(ai.startedAt).toLocaleTimeString() : '-'} />
          <Stat label="Hace" title="Hace — Tiempo transcurrido desde el inicio. Ejemplo: '120 ms ago' en benches cortos." value={startedAgo} />
          <Stat label="Duración última" title="Duración — Tiempo total de la última búsqueda. Ejemplo: cruzar con Nodos para estimar NPS." value={formattedDuration} />
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <div className="text-xs text-neutral-300" title="Usar Workers — Ejecuta la búsqueda en Web Workers para no bloquear la UI. Ejemplo: ON en multi‑núcleo y pruebas de paralelización de raíz; OFF para depurar en hilo principal.">Usar Workers</div>
        <ToggleSwitch
          checked={ai?.useWorkers !== false}
          onChange={(v) => dispatch(setAIUseWorkers(v))}
          offLabel="Off"
          onLabel="On"
          title="Alterna ejecución en Web Worker (aisla CPU de la UI)"
        />
      </div>
      <div className="mt-3 flex items-center gap-2">
        <Button size="sm" variant="primary" onClick={() => dispatch(aiSearchReset())} title="Reset métricas — Pone a cero nodos, profundidad, score y tiempos. Ejemplo: antes de un nuevo bench para no mezclar resultados.">
          Reset métricas
        </Button>
        <Button
          size="sm"
          variant="neutral"
          title="Probar búsqueda (bench) — Ejecuta una búsqueda corta (200ms, profundidad 2) para verificar que la IA progresa. Ejemplo: verifica que la IA puede alcanzar la PV prevista en la iterativa 2."
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
        >
          Probar búsqueda (bench)
        </Button>
        <Button
          size="sm"
          variant="neutral"
          className="bg-red-800 text-red-100 border-red-600 hover:bg-red-700 focus:ring-red-400/30"
          onClick={() => { try { (window as any).__squadroCancelAI?.(); } catch {} }}
          title="Cancelar la búsqueda de IA en curso — Cancela la búsqueda actual y resetea métricas."
        >
          Cancelar búsqueda
        </Button>
      </div>
      </div>
    );
}
