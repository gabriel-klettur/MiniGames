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
  exploreEps?: number;
  onChangeExploreEps?: (n: number) => void;
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

const SimSection: FC<SimSectionProps> = ({ running, gamesCount, onChangeGamesCount, useRootParallel, onToggleUseRootParallel, workers, onChangeWorkers, randomOpeningPlies, onChangeRandomOpeningPlies, exploreEps, onChangeExploreEps, startEligibleLight, onToggleStartEligibleLight, startEligibleDark, onToggleStartEligibleDark, p1, p2, records, moveIndex, moveElapsedMs, moveTargetMs, progDepth = 0, progNodes = 0, progNps = 0, progScore = 0, onCopyRecord, onDownloadRecord, onDeleteRecord }) => {
  const [winnerFilter, setWinnerFilter] = useState<'all' | 'Light' | 'Dark' | 'draw'>('all');
  const recordsFiltered = useMemo(() => {
    if (winnerFilter === 'all') return records;
    if (winnerFilter === 'draw') return records.filter(r => r.winner === 0);
    return records.filter(r => r.winner === winnerFilter);
  }, [records, winnerFilter]);

  // Build a comparator using UI defaults to avoid false positives when a value is undefined
  // but the UI shows the same default para ambos paneles.
  const UI_DEFAULTS: Record<string, any> = {
    // Engine toggles
    enableTT: false,
    enableKillers: false,
    enableHistory: false,
    enablePVS: false,
    enableLMR: false,
    preferHashMove: false,
    enableQuiescence: false,
    enableTablebase: false,
    enableDFPN: false,
    enableLMP: false,
    enableFutility: false,
    enableAspiration: false,
    enableIID: false,
    enableAdaptiveTime: false,
    quiescenceExtendOnRetire: false,
    quiescenceExtendOnJump: false,
    // Engine numbers
    lmrMinDepth: 3,
    lmrLateMoveIdx: 3,
    lmrReduction: 1,
    quiescenceMaxPlies: 4,
    quiescenceStandPatMargin: 0,
    quiescenceSeeMargin: 0,
    dfpnMaxActive: 2,
    lmpMaxDepth: 2,
    lmpBase: 6,
    futilityMargin: 150,
    aspDelta: 25,
    iidMinDepth: 3,
    timeSlackMs: 50,
    adaptiveGrowthFactor: 1.8,
    adaptiveBFWeight: 0.05,
    orderingJitterEps: 0,
    // Heuristic weights
    w_race: 1.0,
    w_clash: 0.8,
    w_sprint: 0.6,
    w_block: 0.3,
    done_bonus: 5.0,
    sprint_threshold: 2,
    tempo: 5,
  };

  const isDiff = (key: string): boolean => {
    const a: any = (p1 as any)?.[key];
    const b: any = (p2 as any)?.[key];
    const da = a ?? UI_DEFAULTS[key];
    const db = b ?? UI_DEFAULTS[key];
    // Normaliza booleanos explícitamente
    const na = typeof da === 'boolean' ? !!da : da;
    const nb = typeof db === 'boolean' ? !!db : db;
    return na !== nb;
  };

  // Ranges for header controls (depth/time/preset)
  const HDR_RANGE: Record<string, { min?: number; max?: number; avg?: number; values?: string }> = {
    depth: { min: 1, max: 20, avg: 3 },
    timeMode: { values: 'Auto / Manual' },
    timeSeconds: { min: 0, max: 60, avg: 0 },
    preset: { values: 'Lista de presets' },
  };
  const hstats = (key: string): string => {
    const r = HDR_RANGE[key];
    if (!r) return '';
    if (r.values) return ` — Valores: ${r.values}`;
    const parts: string[] = [];
    if (typeof r.min === 'number' && typeof r.max === 'number') parts.push(`Rango: ${r.min}–${r.max}`);
    if (typeof r.avg === 'number') parts.push(`Prom: ${r.avg}`);
    return parts.length ? ` — ${parts.join(' · ')}` : '';
  };

  return (
    <div className="infoia-sim flex flex-col gap-3">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-lg border border-neutral-700 bg-neutral-900/60 p-3">
          <div className="section-title font-semibold text-neutral-200" title="Límites de simulación — Controla cuántas partidas se ejecutan y si se paraleliza la raíz. Ejemplo: 50 partidas con Paralelización raíz ON y 4 workers para evaluar jugadas iniciales en paralelo.">Límites de simulación</div>
          <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 auto-rows-min">
            <label className="flex flex-col text-xs text-neutral-300" title="Número de partidas a simular">
              <span>Partidas</span>
              <input
                type="number"
                min={1}
                max={1000}
                value={gamesCount}
                onChange={(e) => onChangeGamesCount(Math.max(1, Math.min(1000, Number(e.target.value))))}
                className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-xs text-neutral-100"
              />
            </label>
            <label className="inline-flex items-center gap-2 text-xs text-neutral-300" title="Activar evaluación de movimientos de raíz en paralelo (usa varios Web Workers)">
              <input type="checkbox" checked={!!useRootParallel} onChange={() => onToggleUseRootParallel?.()} />
              Paralelización raíz
            </label>
            <label className="flex flex-col text-xs text-neutral-300" title="Cantidad de workers paralelos para evaluar jugadas de raíz">
              <span>Workers</span>
              <input
                type="number"
                min={1}
                max={32}
                value={workers ?? 2}
                onChange={(e) => onChangeWorkers?.(Math.max(1, Math.min(32, Number(e.target.value))))}
                className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-xs text-neutral-100"
              />
            </label>
            <label className="flex flex-col text-xs text-neutral-300" title="Número de plies iniciales jugados al azar para diversificar aperturas (0 desactiva)">
              <span>Apertura aleatoria</span>
              <input
                type="number"
                min={0}
                max={20}
                value={randomOpeningPlies ?? 0}
                onChange={(e) => onChangeRandomOpeningPlies?.(Math.max(0, Math.min(20, Number(e.target.value))))}
                className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-xs text-neutral-100"
              />
            </label>
            <label className="flex flex-col text-xs text-neutral-300" title="Exploración ε — Probabilidad por jugada de elegir un movimiento aleatorio tras la apertura para generar diversidad en self-play. 0 desactiva.">
              <span>Expl. ε</span>
              <input
                type="number"
                min={0}
                max={1}
                step={0.01}
                value={typeof exploreEps === 'number' ? exploreEps : 0}
                onChange={(e) => onChangeExploreEps?.(Math.max(0, Math.min(1, Number(e.target.value))))}
                className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-xs text-neutral-100"
              />
            </label>
            <label className="inline-flex items-center gap-2 text-xs text-neutral-300" title="Permitir que Light sea jugador inicial en cada partida simulada (si ambos están permitidos, se elige al azar).">
              <input type="checkbox" checked={!!startEligibleLight} onChange={() => onToggleStartEligibleLight?.()} />
              Puede iniciar Light
            </label>
            <label className="inline-flex items-center gap-2 text-xs text-neutral-300" title="Permitir que Dark sea jugador inicial en cada partida simulada (si ambos están permitidos, se elige al azar).">
              <input type="checkbox" checked={!!startEligibleDark} onChange={() => onToggleStartEligibleDark?.()} />
              Puede iniciar Dark
            </label>
          </div>
        </div>
        <div className="rounded-lg border border-neutral-700 bg-neutral-900/60 p-3">
          <div className="section-title font-semibold text-neutral-200" title={`${p1.title} — Ajustes del motor y heurística para el Jugador 1. Ejemplo: Profundidad 5, Tiempo Auto, TT+PVS+Killers+History ON, LMR configurado.`}>{p1.title}</div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <label className="text-xs text-neutral-300" title={"Profundidad objetivo de búsqueda para el Jugador 1" + hstats('depth')}>
              Profundidad
              <input type="number" min={1} max={20} value={p1.depth} onChange={(e) => p1.onChangeDepth(Math.max(1, Math.min(20, Number(e.target.value))))} className={"w-20 ml-2 bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-xs text-neutral-100" + (p1.depth !== p2.depth ? ' border-amber-400' : '')} />
            </label>
            <label className="text-xs text-neutral-300" title={"Modo de tiempo para Jugador 1: Auto = infinito (se pasa Infinity al motor); Manual = segundos fijos. Nota: Manual con 0 segundos también equivale a infinito." + hstats('timeMode')}>
              Tiempo
              <select value={p1.timeMode} onChange={(e) => p1.onChangeTimeMode(e.target.value as any)} className={"ml-2 bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-xs text-neutral-100" + (p1.timeMode !== p2.timeMode ? ' border-amber-400' : '')}>
                <option value="auto">Auto</option>
                <option value="manual">Manual</option>
              </select>
            </label>
            {p1.timeMode === 'manual' && (
              <label className="text-xs text-neutral-300" title={"Límite de tiempo (segundos) por jugada para Jugador 1. Consejo: 0 segundos se interpreta como infinito." + hstats('timeSeconds')}>
                Segundos
                <input type="number" min={0} max={60} value={p1.timeSeconds} onChange={(e) => p1.onChangeTimeSeconds(Math.max(0, Math.min(60, Number(e.target.value))))} className={"w-20 ml-2 bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-xs text-neutral-100" + (p1.timeSeconds !== p2.timeSeconds ? ' border-amber-400' : '')} />
              </label>
            )}
            {p1.presetOptions && p1.onChangePreset && (
              <label className="text-xs text-neutral-300 col-span-2" title={"Selecciona un preset de IA para Jugador 1" + hstats('preset')}>
                Preset
                <select value={p1.presetSelectedKey || ''} onChange={(e) => p1.onChangePreset!(e.target.value)} className="ml-2 bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-xs text-neutral-100">
                  <option value="">(ninguno)</option>
                  {p1.presetOptions.map((opt) => (<option key={opt.key} value={opt.key}>{opt.label}</option>))}
                </select>
              </label>
            )}
          </div>
          <PlayerEngineOptions {...(p1 as any)} isDiff={isDiff} />
        </div>
        <div className="rounded-lg border border-neutral-700 bg-neutral-900/60 p-3">
          <div className="section-title font-semibold text-neutral-200" title={`${p2.title} — Ajustes del motor y heurística para el Jugador 2. Útil para A/B testing contra Jugador 1.`}>{p2.title}</div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <label className="text-xs text-neutral-300" title={"Profundidad objetivo de búsqueda para el Jugador 2" + hstats('depth')}>
              Profundidad
              <input type="number" min={1} max={20} value={p2.depth} onChange={(e) => p2.onChangeDepth(Math.max(1, Math.min(20, Number(e.target.value))))} className={"w-20 ml-2 bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-xs text-neutral-100" + (p1.depth !== p2.depth ? ' border-amber-400' : '')} />
            </label>
            <label className="text-xs text-neutral-300" title={"Modo de tiempo para Jugador 2: Auto = infinito (se pasa Infinity al motor); Manual = segundos fijos. Nota: Manual con 0 segundos también equivale a infinito." + hstats('timeMode')}>
              Tiempo
              <select value={p2.timeMode} onChange={(e) => p2.onChangeTimeMode(e.target.value as any)} className={"ml-2 bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-xs text-neutral-100" + (p1.timeMode !== p2.timeMode ? ' border-amber-400' : '')}>
                <option value="auto">Auto</option>
                <option value="manual">Manual</option>
              </select>
            </label>
            {p2.timeMode === 'manual' && (
              <label className="text-xs text-neutral-300" title={"Límite de tiempo (segundos) por jugada para Jugador 2. Consejo: 0 segundos se interpreta como infinito." + hstats('timeSeconds')}>
                Segundos
                <input type="number" min={0} max={60} value={p2.timeSeconds} onChange={(e) => p2.onChangeTimeSeconds(Math.max(0, Math.min(60, Number(e.target.value))))} className={"w-20 ml-2 bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-xs text-neutral-100" + (p1.timeSeconds !== p2.timeSeconds ? ' border-amber-400' : '')} />
              </label>
            )}
            {p2.presetOptions && p2.onChangePreset && (
              <label className="text-xs text-neutral-300 col-span-2" title={"Selecciona un preset de IA para Jugador 2" + hstats('preset')}>
                Preset
                <select value={p2.presetSelectedKey || ''} onChange={(e) => p2.onChangePreset!(e.target.value)} className="ml-2 bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-xs text-neutral-100">
                  <option value="">(ninguno)</option>
                  {p2.presetOptions.map((opt) => (<option key={opt.key} value={opt.key}>{opt.label}</option>))}
                </select>
              </label>
            )}
          </div>
          <PlayerEngineOptions {...(p2 as any)} isDiff={isDiff} />
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
