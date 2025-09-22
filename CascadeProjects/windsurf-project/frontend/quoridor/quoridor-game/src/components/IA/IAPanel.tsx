import { useAppDispatch, useAppSelector } from '../../store/hooks.ts';
import type { RootState } from '../../store/index.ts';
import {
  setDepth,
  setTimeMode,
  setTimeSeconds,
  toggleAutoplay,
  toggleAIForL,
  toggleAIForD,
  setEnableMoveOrdering,
  setMaxWallsRoot,
  setMaxWallsNode,
  setEnableTT,
  setTTSize,
  setEnableIterative,
  setEnableAlphaBeta,
  setRandomTieBreak,
  setHardTimeLimit,
} from '../../store/iaSlice.ts';
import { useAI } from '../../ia/useAI.ts';

/**
 * IAPanel — Panel de desarrollo para configurar la IA:
 * - Profundidad, tiempo (auto/manual + segundos)
 * - Autoplay y qué bandos controla la IA (L/D)
 * - KPIs del último cálculo y top jugadas raíz
 */
export default function IAPanel() {
  const dispatch = useAppDispatch();
  const ia = useAppSelector((s: RootState) => s.ia);
  const game = useAppSelector((s: RootState) => s.game);
  const { requestAIMove, busy, stats } = useAI();

  return (
    <section className="rounded-lg border border-white/10 bg-gray-900/60 p-4 space-y-4" aria-label="IA (desarrollo)">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <label htmlFor="ia-depth-dev" className="text-sm">Profundidad</label>
          <select
            id="ia-depth-dev"
            value={ia.depth}
            onChange={(e) => dispatch(setDepth(Number(e.target.value)))}
            className="bg-gray-800 text-gray-100 text-sm rounded-md px-2 py-1 border border-white/10"
          >
            {[1,2,3,4,5,6,7,8,9,10].map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm">Tiempo</span>
          <div className="inline-flex rounded-md overflow-hidden border border-white/10">
            <button
              className={["px-3 py-1.5 text-sm", ia.timeMode === 'auto' ? 'bg-emerald-700 text-white' : 'bg-gray-800 text-gray-100 hover:bg-gray-700'].join(' ')}
              onClick={() => dispatch(setTimeMode('auto'))}
              aria-pressed={ia.timeMode === 'auto'}
            >Auto</button>
            <button
              className={["px-3 py-1.5 text-sm", ia.timeMode === 'manual' ? 'bg-emerald-700 text-white' : 'bg-gray-800 text-gray-100 hover:bg-gray-700'].join(' ')}
              onClick={() => dispatch(setTimeMode('manual'))}
              aria-pressed={ia.timeMode === 'manual'}
            >Manual</button>
          </div>
          {ia.timeMode === 'manual' && (
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={0}
                max={30}
                step={0.5}
                value={ia.timeSeconds}
                onChange={(e) => dispatch(setTimeSeconds(Number(e.target.value)))}
              />
              <span className="text-xs text-gray-300 w-14 text-right">{Number(ia.timeSeconds).toFixed(1)} s</span>
            </div>
          )}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button
            className="inline-flex items-center gap-2 rounded-md bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 text-sm text-white disabled:opacity-60"
            onClick={() => requestAIMove()}
            disabled={busy || !ia.control[game.current]}
            title="Hacer que la IA juegue su turno"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M11 2h2v3h-2z"/></svg>
            Mover IA
          </button>
          <button
            className={["rounded-md px-3 py-1.5 text-sm", ia.autoplay ? 'bg-rose-700 hover:bg-rose-600 text-white' : 'bg-gray-800 hover:bg-gray-700 text-gray-100'].join(' ')}
            onClick={() => dispatch(toggleAutoplay())}
            aria-pressed={ia.autoplay}
            disabled={busy && !ia.autoplay}
          >{ia.autoplay ? 'Detener autoplay' : 'Autoplay'}</button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xs text-gray-300">Control IA:</span>
        <label className="inline-flex items-center gap-1 text-sm">
          <input type="checkbox" checked={ia.control.L} onChange={() => dispatch(toggleAIForL())} /> Claras (L)
        </label>
        <label className="inline-flex items-center gap-1 text-sm">
          <input type="checkbox" checked={ia.control.D} onChange={() => dispatch(toggleAIForD())} /> Oscuras (D)
        </label>
        <span className="ml-auto text-xs text-gray-400">Turno: {game.current === 'L' ? 'Claras (L)' : 'Oscuras (D)'}</span>
      </div>

      {/* Configuración avanzada */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="text-sm font-medium">Evaluación</div>
          <div className="flex items-center gap-3 text-sm">
            <span className="px-2 py-1 rounded bg-gray-800/80">Eval: {stats.evalScore === null ? 'NO INFO' : (stats.evalScore > 0 ? `+${stats.evalScore.toFixed(1)}` : stats.evalScore.toFixed(1))}</span>
            <span className="px-2 py-1 rounded bg-gray-800/80">Profundidad: d={stats.depthReached}</span>
          </div>
          <div className="text-xs text-gray-300">PV: {stats.pv && stats.pv.length ? stats.pv.length : 0} jugadas</div>
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span>Nodos: {stats.nodes.toLocaleString()}</span>
            <span>
              Tiempo: <span className={[
                ia.timeMode === 'manual' && stats.elapsedMs > ia.timeSeconds * 1000 ? 'text-rose-400 font-semibold' : ''
              ].join(' ')}>{(stats.elapsedMs / 1000).toFixed(2)} s</span>
            </span>
          </div>
          {ia.timeMode === 'manual' && stats.elapsedMs > ia.timeSeconds * 1000 && (
            <div className="text-xs text-rose-400">Aviso: el cálculo superó el tiempo configurado.</div>
          )}
        </div>

        <div className="space-y-3">
          <div className="text-sm font-medium">Top jugadas (raíz)</div>
          <ol className="space-y-1 text-xs text-gray-200 max-h-36 overflow-auto pr-1">
            {stats.rootMoves && stats.rootMoves.length ? (
              stats.rootMoves
                .slice(0, 8)
                .sort((a, b) => b.score - a.score)
                .map((r, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <div className="h-1.5 bg-emerald-600/60" style={{ width: `${Math.min(100, Math.max(0, 50 + r.score * 5))}%` }} />
                    <span>{r.score > 0 ? `+${r.score.toFixed(1)}` : r.score.toFixed(1)}</span>
                  </li>
                ))
            ) : (
              <li className="text-gray-400">NO INFO</li>
            )}
          </ol>

          {/* Extensibilidad y puntos de variación */}
          <div className="pt-2 border-t border-white/10 space-y-2">
            <div className="text-sm font-medium">Extensibilidad (Dev)</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" checked={ia.config.enableMoveOrdering} onChange={(e) => dispatch(setEnableMoveOrdering(e.target.checked))} />
                Ordenar jugadas
              </label>
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" checked={ia.config.enableAlphaBeta} onChange={(e) => dispatch(setEnableAlphaBeta(e.target.checked))} />
                Poda Alpha-Beta
              </label>
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" checked={ia.config.enableIterative} onChange={(e) => dispatch(setEnableIterative(e.target.checked))} />
                Profundización iterativa
              </label>
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" checked={ia.config.randomTieBreak} onChange={(e) => dispatch(setRandomTieBreak(e.target.checked))} />
                Desempate aleatorio
              </label>
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" checked={ia.config.hardTimeLimit} onChange={(e) => dispatch(setHardTimeLimit(e.target.checked))} />
                Corte estricto por tiempo
              </label>
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" checked={ia.config.enableTT} onChange={(e) => dispatch(setEnableTT(e.target.checked))} />
                Tabla de transposición (TT)
              </label>
              <div className="flex items-center gap-2">
                <span>TT tamaño</span>
                <input
                  type="range"
                  min={0}
                  max={131072}
                  step={1024}
                  value={ia.config.ttSize}
                  onChange={(e) => dispatch(setTTSize(Number(e.target.value)))}
                  className="flex-1"
                />
                <span className="w-16 text-right">{ia.config.ttSize}</span>
              </div>
              <div className="flex items-center gap-2">
                <span>Walls raíz</span>
                <input
                  className="w-20 bg-gray-800 border border-white/10 rounded px-2 py-1"
                  type="number"
                  min={0}
                  max={200}
                  value={ia.config.maxWallsRoot}
                  onChange={(e) => dispatch(setMaxWallsRoot(Number(e.target.value))) }
                />
              </div>
              <div className="flex items-center gap-2">
                <span>Walls nodo</span>
                <input
                  className="w-20 bg-gray-800 border border-white/10 rounded px-2 py-1"
                  type="number"
                  min={0}
                  max={200}
                  value={ia.config.maxWallsNode}
                  onChange={(e) => dispatch(setMaxWallsNode(Number(e.target.value))) }
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

