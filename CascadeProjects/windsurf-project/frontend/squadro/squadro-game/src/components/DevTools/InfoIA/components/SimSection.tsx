import { useMemo, useState } from 'react';
import type { FC } from 'react';
import TimeBar from '../views/TimeBar';
import type { InfoIARecord, PlayerControlsProps } from '../types';
import PlayerEngineOptions from './PlayerEngineOptions';
import TablaIA from '../views/Tabla/TablaIA';

interface SimSectionProps {
  running: boolean;
  gamesCount: number;
  onChangeGamesCount: (v: number) => void;
  useRootParallel?: boolean;
  onToggleUseRootParallel?: () => void;
  workers?: number;
  onChangeWorkers?: (n: number) => void;
  randomOpeningPlies?: number;
  onChangeRandomOpeningPlies?: (n: number) => void;
  startEligibleLight?: boolean;
  onToggleStartEligibleLight?: () => void;
  startEligibleDark?: boolean;
  onToggleStartEligibleDark?: () => void;
  p1: PlayerControlsProps;
  p2: PlayerControlsProps;
  records: InfoIARecord[];
  moveIndex: number;
  moveElapsedMs: number;
  moveTargetMs?: number;
  progDepth?: number;
  progNodes?: number;
  progNps?: number;
  progScore?: number;
  onCopyRecord: (id: string) => void;
  onDownloadRecord: (id: string) => void;
  onDeleteRecord: (id: string) => void;
}

const SimSection: FC<SimSectionProps> = ({ running, gamesCount, onChangeGamesCount, useRootParallel, onToggleUseRootParallel, workers, onChangeWorkers, randomOpeningPlies, onChangeRandomOpeningPlies, startEligibleLight, onToggleStartEligibleLight, startEligibleDark, onToggleStartEligibleDark, p1, p2, records, moveIndex, moveElapsedMs, moveTargetMs, progDepth = 0, progNodes = 0, progNps = 0, progScore = 0, onCopyRecord, onDownloadRecord, onDeleteRecord }) => {
  const [winnerFilter, setWinnerFilter] = useState<'all' | 'Light' | 'Dark' | 'draw'>('all');
  const recordsFiltered = useMemo(() => {
    if (winnerFilter === 'all') return records;
    if (winnerFilter === 'draw') return records.filter(r => r.winner === 0);
    return records.filter(r => r.winner === winnerFilter);
  }, [records, winnerFilter]);

  return (
    <div className="infoia-sim flex flex-col gap-3">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-lg border border-neutral-700 bg-neutral-900/60 p-3">
          <div className="section-title font-semibold text-neutral-200" title="Límites de simulación — Controla cuántas partidas se ejecutan y si se paraleliza la raíz. Ejemplo: 50 partidas con Paralelización raíz ON y 4 workers para evaluar jugadas iniciales en paralelo.">Límites de simulación</div>
          <label className="mt-2 inline-flex items-center gap-2 text-xs text-neutral-300">
            Partidas
            <input
              type="number"
              min={1}
              max={1000}
              value={gamesCount}
              onChange={(e) => onChangeGamesCount(Math.max(1, Math.min(1000, Number(e.target.value))))}
              className="w-20 bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-xs text-neutral-100"
              title="Número de partidas a simular"
            />
          </label>
          <div className="mt-2 flex items-center gap-3 text-xs text-neutral-300">
            <label className="inline-flex items-center gap-2" title="Activar evaluación de movimientos de raíz en paralelo (usa varios Web Workers)">
              <input type="checkbox" checked={!!useRootParallel} onChange={() => onToggleUseRootParallel?.()} />
              Paralelización raíz
            </label>
            <label className="inline-flex items-center gap-2" title="Cantidad de workers paralelos para evaluar jugadas de raíz">
              Workers
              <input
                type="number"
                min={1}
                max={32}
                value={workers ?? 2}
                onChange={(e) => onChangeWorkers?.(Math.max(1, Math.min(32, Number(e.target.value))))}
                className="w-16 bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-xs text-neutral-100"
              />
            </label>
            <label className="inline-flex items-center gap-2" title="Número de plies iniciales jugados al azar para diversificar aperturas (0 desactiva)">
              Apertura aleatoria
              <input
                type="number"
                min={0}
                max={20}
                value={randomOpeningPlies ?? 0}
                onChange={(e) => onChangeRandomOpeningPlies?.(Math.max(0, Math.min(20, Number(e.target.value))))}
                className="w-16 bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-xs text-neutral-100"
              />
            </label>
            <label className="inline-flex items-center gap-2" title="Permitir que Light sea jugador inicial en cada partida simulada (si ambos están permitidos, se elige al azar).">
              <input type="checkbox" checked={!!startEligibleLight} onChange={() => onToggleStartEligibleLight?.()} />
              Puede iniciar Light
            </label>
            <label className="inline-flex items-center gap-2" title="Permitir que Dark sea jugador inicial en cada partida simulada (si ambos están permitidos, se elige al azar).">
              <input type="checkbox" checked={!!startEligibleDark} onChange={() => onToggleStartEligibleDark?.()} />
              Puede iniciar Dark
            </label>
          </div>
        </div>
        <div className="rounded-lg border border-neutral-700 bg-neutral-900/60 p-3">
          <div className="section-title font-semibold text-neutral-200" title={`${p1.title} — Ajustes del motor y heurística para el Jugador 1. Ejemplo: Profundidad 5, Tiempo Auto, TT+PVS+Killers+History ON, LMR configurado.`}>{p1.title}</div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <label className="text-xs text-neutral-300" title="Profundidad objetivo de búsqueda para el Jugador 1">
              Profundidad
              <input type="number" min={1} max={20} value={p1.depth} onChange={(e) => p1.onChangeDepth(Math.max(1, Math.min(20, Number(e.target.value))))} className="w-20 ml-2 bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-xs text-neutral-100" />
            </label>
            <label className="text-xs text-neutral-300" title="Modo de tiempo para Jugador 1: Auto = infinito (se pasa Infinity al motor); Manual = segundos fijos. Nota: Manual con 0 segundos también equivale a infinito.">
              Tiempo
              <select value={p1.timeMode} onChange={(e) => p1.onChangeTimeMode(e.target.value as any)} className="ml-2 bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-xs text-neutral-100">
                <option value="auto">Auto</option>
                <option value="manual">Manual</option>
              </select>
            </label>
            {p1.timeMode === 'manual' && (
              <label className="text-xs text-neutral-300" title="Límite de tiempo (segundos) por jugada para Jugador 1. Consejo: 0 segundos se interpreta como infinito.">
                Segundos
                <input type="number" min={0} max={60} value={p1.timeSeconds} onChange={(e) => p1.onChangeTimeSeconds(Math.max(0, Math.min(60, Number(e.target.value))))} className="w-20 ml-2 bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-xs text-neutral-100" />
              </label>
            )}
            {p1.presetOptions && p1.onChangePreset && (
              <label className="text-xs text-neutral-300 col-span-2" title="Selecciona un preset de IA para Jugador 1">
                Preset
                <select value={p1.presetSelectedKey || ''} onChange={(e) => p1.onChangePreset!(e.target.value)} className="ml-2 bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-xs text-neutral-100">
                  <option value="">(ninguno)</option>
                  {p1.presetOptions.map((opt) => (<option key={opt.key} value={opt.key}>{opt.label}</option>))}
                </select>
              </label>
            )}
          </div>
          <PlayerEngineOptions
            enableTT={p1.enableTT}
            onToggleEnableTT={p1.onToggleEnableTT}
            enablePVS={p1.enablePVS}
            onToggleEnablePVS={p1.onToggleEnablePVS}
            enableKillers={p1.enableKillers}
            onToggleEnableKillers={p1.onToggleEnableKillers}
            enableHistory={p1.enableHistory}
            onToggleEnableHistory={p1.onToggleEnableHistory}
            preferHashMove={p1.preferHashMove}
            onTogglePreferHashMove={p1.onTogglePreferHashMove}
            enableLMR={p1.enableLMR}
            onToggleEnableLMR={p1.onToggleEnableLMR}
            lmrMinDepth={p1.lmrMinDepth}
            onChangeLmrMinDepth={p1.onChangeLmrMinDepth}
            lmrLateMoveIdx={p1.lmrLateMoveIdx}
            onChangeLmrLateMoveIdx={p1.onChangeLmrLateMoveIdx}
            lmrReduction={p1.lmrReduction}
            onChangeLmrReduction={p1.onChangeLmrReduction}
            orderingJitterEps={p1.orderingJitterEps}
            onChangeOrderingJitterEps={p1.onChangeOrderingJitterEps}
            // Heuristic weights
            w_race={p1.w_race}
            onChangeWRace={p1.onChangeWRace}
            w_clash={p1.w_clash}
            onChangeWClash={p1.onChangeWClash}
            w_sprint={p1.w_sprint}
            onChangeWSprint={p1.onChangeWSprint}
            w_block={p1.w_block}
            onChangeWBlock={p1.onChangeWBlock}
            done_bonus={p1.done_bonus}
            onChangeDoneBonus={p1.onChangeDoneBonus}
            sprint_threshold={p1.sprint_threshold}
            onChangeSprintThreshold={p1.onChangeSprintThreshold}
            tempo={p1.tempo}
            onChangeTempo={p1.onChangeTempo}
          />
        </div>
        <div className="rounded-lg border border-neutral-700 bg-neutral-900/60 p-3">
          <div className="section-title font-semibold text-neutral-200" title={`${p2.title} — Ajustes del motor y heurística para el Jugador 2. Útil para A/B testing contra Jugador 1.`}>{p2.title}</div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <label className="text-xs text-neutral-300" title="Profundidad objetivo de búsqueda para el Jugador 2">
              Profundidad
              <input type="number" min={1} max={20} value={p2.depth} onChange={(e) => p2.onChangeDepth(Math.max(1, Math.min(20, Number(e.target.value))))} className="w-20 ml-2 bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-xs text-neutral-100" />
            </label>
            <label className="text-xs text-neutral-300" title="Modo de tiempo para Jugador 2: Auto = infinito (se pasa Infinity al motor); Manual = segundos fijos. Nota: Manual con 0 segundos también equivale a infinito.">
              Tiempo
              <select value={p2.timeMode} onChange={(e) => p2.onChangeTimeMode(e.target.value as any)} className="ml-2 bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-xs text-neutral-100">
                <option value="auto">Auto</option>
                <option value="manual">Manual</option>
              </select>
            </label>
            {p2.timeMode === 'manual' && (
              <label className="text-xs text-neutral-300" title="Límite de tiempo (segundos) por jugada para Jugador 2. Consejo: 0 segundos se interpreta como infinito.">
                Segundos
                <input type="number" min={0} max={60} value={p2.timeSeconds} onChange={(e) => p2.onChangeTimeSeconds(Math.max(0, Math.min(60, Number(e.target.value))))} className="w-20 ml-2 bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-xs text-neutral-100" />
              </label>
            )}
            {p2.presetOptions && p2.onChangePreset && (
              <label className="text-xs text-neutral-300 col-span-2" title="Selecciona un preset de IA para Jugador 2">
                Preset
                <select value={p2.presetSelectedKey || ''} onChange={(e) => p2.onChangePreset!(e.target.value)} className="ml-2 bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-xs text-neutral-100">
                  <option value="">(ninguno)</option>
                  {p2.presetOptions.map((opt) => (<option key={opt.key} value={opt.key}>{opt.label}</option>))}
                </select>
              </label>
            )}
          </div>
          <PlayerEngineOptions
            enableTT={p2.enableTT}
            onToggleEnableTT={p2.onToggleEnableTT}
            enablePVS={p2.enablePVS}
            onToggleEnablePVS={p2.onToggleEnablePVS}
            enableKillers={p2.enableKillers}
            onToggleEnableKillers={p2.onToggleEnableKillers}
            enableHistory={p2.enableHistory}
            onToggleEnableHistory={p2.onToggleEnableHistory}
            preferHashMove={p2.preferHashMove}
            onTogglePreferHashMove={p2.onTogglePreferHashMove}
            enableLMR={p2.enableLMR}
            onToggleEnableLMR={p2.onToggleEnableLMR}
            lmrMinDepth={p2.lmrMinDepth}
            onChangeLmrMinDepth={p2.onChangeLmrMinDepth}
            lmrLateMoveIdx={p2.lmrLateMoveIdx}
            onChangeLmrLateMoveIdx={p2.onChangeLmrLateMoveIdx}
            lmrReduction={p2.lmrReduction}
            onChangeLmrReduction={p2.onChangeLmrReduction}
            orderingJitterEps={p2.orderingJitterEps}
            onChangeOrderingJitterEps={p2.onChangeOrderingJitterEps}
            // Heuristic weights
            w_race={p2.w_race}
            onChangeWRace={p2.onChangeWRace}
            w_clash={p2.w_clash}
            onChangeWClash={p2.onChangeWClash}
            w_sprint={p2.w_sprint}
            onChangeWSprint={p2.onChangeWSprint}
            w_block={p2.w_block}
            onChangeWBlock={p2.onChangeWBlock}
            done_bonus={p2.done_bonus}
            onChangeDoneBonus={p2.onChangeDoneBonus}
            sprint_threshold={p2.sprint_threshold}
            onChangeSprintThreshold={p2.onChangeSprintThreshold}
            tempo={p2.tempo}
            onChangeTempo={p2.onChangeTempo}
          />
        </div>
      </div>

      {running && <TimeBar moveIndex={moveIndex} moveElapsedMs={moveElapsedMs} moveTargetMs={moveTargetMs} />}
      {running && (
        <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-neutral-700 bg-neutral-900/80" title="Jugador — Quién mueve en la jugada actual (Light/Dark). Afecta el signo del score y el bonus de tempo.">
            <strong>Jugador</strong> {moveIndex % 2 === 1 ? 'Light' : 'Dark'}
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-neutral-700 bg-neutral-900/80" title="Depth — Profundidad de la iteración actual. Debería incrementarse hasta el objetivo si el tiempo alcanza.">
            <strong>Depth</strong> {progDepth}
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-neutral-700 bg-neutral-900/80" title="Nodes — Posiciones evaluadas hasta ahora en esta jugada. Úsalo junto a t para estimar NPS.">
            <strong>Nodes</strong> {progNodes.toLocaleString()}
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-neutral-700 bg-neutral-900/80" title="NPS — Nodos por segundo. Indicador de rendimiento bruto del motor.">
            <strong>NPS</strong> {progNps.toLocaleString()}
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-neutral-700 bg-neutral-900/80" title="Score — Evaluación heurística; positivo favorece al jugador que mueve. Útil para ver si la PV tiene coherencia.">
            <strong>Score</strong> {progScore}
          </span>
        </div>
      )}

      {/* Aggregate summary across completed games (updates live) */}
      <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
        <label className="inline-flex items-center gap-2 mr-2" title="Filtro por ganador — Muestra sólo partidas donde ganó Light, Dark o hubo empate. Útil para estudiar sesgos o ventajas por configuración.">
          <span className="text-neutral-300">Ganador</span>
          <select
            className="bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-xs text-neutral-100"
            value={winnerFilter}
            onChange={(e) => setWinnerFilter(e.target.value as any)}
          >
            <option value="all">Todos</option>
            <option value="Light">Light</option>
            <option value="Dark">Dark</option>
            <option value="draw">Empate</option>
          </select>
        </label>
        {(() => {
          const total = recordsFiltered.length;
          const wL = recordsFiltered.filter(r => r.winner === 'Light').length;
          const wD = recordsFiltered.filter(r => r.winner === 'Dark').length;
          const draws = recordsFiltered.filter(r => r.winner === 0).length;
          const durs = recordsFiltered.map(r => r.durationMs);
          const min = durs.length ? Math.min(...durs) : 0;
          const max = durs.length ? Math.max(...durs) : 0;
          const sum = durs.reduce((a, b) => a + b, 0);
          const wrL = total ? Math.round((wL * 1000) / total) / 10 : 0;
          const wrD = total ? Math.round((wD * 1000) / total) / 10 : 0;
          return (
            <>
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-neutral-700 bg-neutral-900/80" title="Partidas — Total de partidas tras aplicar el filtro.">
                <strong>Partidas</strong> {total}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-neutral-700 bg-neutral-900/80" title="WR (Light) — Win Rate del bando Light en % sobre el conjunto filtrado.">
                <strong>WR (Light)</strong> {wrL}%
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-neutral-700 bg-neutral-900/80" title="WR (Dark) — Win Rate del bando Dark en % sobre el conjunto filtrado.">
                <strong>WR (Dark)</strong> {wrD}%
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-neutral-700 bg-neutral-900/80" title="Empates — Cantidad de partidas que terminaron en empate.">
                <strong>Empates</strong> {draws}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-neutral-700 bg-neutral-900/80" title="Min — Duración mínima (segundos) entre las partidas filtradas.">
                <strong>Min (s)</strong> {(min/1000).toFixed(2)}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-neutral-700 bg-neutral-900/80" title="Máx — Duración máxima (segundos) entre las partidas filtradas.">
                <strong>Máx (s)</strong> {(max/1000).toFixed(2)}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-neutral-700 bg-neutral-900/80" title="Total — Suma de los tiempos (segundos) de todas las partidas filtradas.">
                <strong>Total (s)</strong> {(sum/1000).toFixed(2)}
              </span>
            </>
          );
        })()}
      </div>

      <div className="rounded-lg border border-neutral-700 bg-neutral-900/60 p-3">
        <div className="section-title font-semibold text-neutral-200 mb-2" title="Resultados — Tabla de partidas y detalles por jugada para analizar profundidad, nodos, NPS y score.">Resultados</div>
        <TablaIA
          records={records}
          onCopyRecord={onCopyRecord}
          onDownloadRecord={onDownloadRecord}
          onDeleteRecord={onDeleteRecord}
        />
      </div>
    </div>
  );
}
;

export default SimSection;
