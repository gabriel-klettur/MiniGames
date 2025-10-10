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

const SimSection: FC<SimSectionProps> = ({ running, gamesCount, onChangeGamesCount, p1, p2, records, moveIndex, moveElapsedMs, moveTargetMs, progDepth = 0, progNodes = 0, progNps = 0, progScore = 0, onCopyRecord, onDownloadRecord, onDeleteRecord }) => {
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
          <div className="section-title font-semibold text-neutral-200">Límites de simulación</div>
          <label className="mt-2 inline-flex items-center gap-2 text-xs text-neutral-300">
            Partidas
            <input
              type="number"
              min={1}
              max={1000}
              value={gamesCount}
              onChange={(e) => onChangeGamesCount(Math.max(1, Math.min(1000, Number(e.target.value))))}
              className="w-20 bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-xs text-neutral-100"
            />
          </label>
        </div>
        <div className="rounded-lg border border-neutral-700 bg-neutral-900/60 p-3">
          <div className="section-title font-semibold text-neutral-200">{p1.title}</div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <label className="text-xs text-neutral-300">Profundidad
              <input type="number" min={1} max={20} value={p1.depth} onChange={(e) => p1.onChangeDepth(Math.max(1, Math.min(20, Number(e.target.value))))} className="w-20 ml-2 bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-xs text-neutral-100" />
            </label>
            <label className="text-xs text-neutral-300">Tiempo
              <select value={p1.timeMode} onChange={(e) => p1.onChangeTimeMode(e.target.value as any)} className="ml-2 bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-xs text-neutral-100">
                <option value="auto">Auto</option>
                <option value="manual">Manual</option>
              </select>
            </label>
            {p1.timeMode === 'manual' && (
              <label className="text-xs text-neutral-300">Segundos
                <input type="number" min={0} max={60} value={p1.timeSeconds} onChange={(e) => p1.onChangeTimeSeconds(Math.max(0, Math.min(60, Number(e.target.value))))} className="w-20 ml-2 bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-xs text-neutral-100" />
              </label>
            )}
            {p1.presetOptions && p1.onChangePreset && (
              <label className="text-xs text-neutral-300 col-span-2">Preset
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
            enableLMR={p1.enableLMR}
            onToggleEnableLMR={p1.onToggleEnableLMR}
            lmrMinDepth={p1.lmrMinDepth}
            onChangeLmrMinDepth={p1.onChangeLmrMinDepth}
            lmrLateMoveIdx={p1.lmrLateMoveIdx}
            onChangeLmrLateMoveIdx={p1.onChangeLmrLateMoveIdx}
            lmrReduction={p1.lmrReduction}
            onChangeLmrReduction={p1.onChangeLmrReduction}
          />
        </div>
        <div className="rounded-lg border border-neutral-700 bg-neutral-900/60 p-3">
          <div className="section-title font-semibold text-neutral-200">{p2.title}</div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <label className="text-xs text-neutral-300">Profundidad
              <input type="number" min={1} max={20} value={p2.depth} onChange={(e) => p2.onChangeDepth(Math.max(1, Math.min(20, Number(e.target.value))))} className="w-20 ml-2 bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-xs text-neutral-100" />
            </label>
            <label className="text-xs text-neutral-300">Tiempo
              <select value={p2.timeMode} onChange={(e) => p2.onChangeTimeMode(e.target.value as any)} className="ml-2 bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-xs text-neutral-100">
                <option value="auto">Auto</option>
                <option value="manual">Manual</option>
              </select>
            </label>
            {p2.timeMode === 'manual' && (
              <label className="text-xs text-neutral-300">Segundos
                <input type="number" min={0} max={60} value={p2.timeSeconds} onChange={(e) => p2.onChangeTimeSeconds(Math.max(0, Math.min(60, Number(e.target.value))))} className="w-20 ml-2 bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-xs text-neutral-100" />
              </label>
            )}
            {p2.presetOptions && p2.onChangePreset && (
              <label className="text-xs text-neutral-300 col-span-2">Preset
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
            enableLMR={p2.enableLMR}
            onToggleEnableLMR={p2.onToggleEnableLMR}
            lmrMinDepth={p2.lmrMinDepth}
            onChangeLmrMinDepth={p2.onChangeLmrMinDepth}
            lmrLateMoveIdx={p2.lmrLateMoveIdx}
            onChangeLmrLateMoveIdx={p2.onChangeLmrLateMoveIdx}
            lmrReduction={p2.lmrReduction}
            onChangeLmrReduction={p2.onChangeLmrReduction}
          />
        </div>
      </div>

      {running && <TimeBar moveIndex={moveIndex} moveElapsedMs={moveElapsedMs} moveTargetMs={moveTargetMs} />}
      {running && (
        <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-neutral-700 bg-neutral-900/80">
            <strong>Jugador</strong> {moveIndex % 2 === 1 ? 'Light' : 'Dark'}
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-neutral-700 bg-neutral-900/80">
            <strong>Depth</strong> {progDepth}
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-neutral-700 bg-neutral-900/80">
            <strong>Nodes</strong> {progNodes.toLocaleString()}
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-neutral-700 bg-neutral-900/80">
            <strong>NPS</strong> {progNps.toLocaleString()}
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-neutral-700 bg-neutral-900/80">
            <strong>Score</strong> {progScore}
          </span>
        </div>
      )}

      {/* Aggregate summary across completed games (updates live) */}
      <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
        <label className="inline-flex items-center gap-2 mr-2">
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
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-neutral-700 bg-neutral-900/80">
                <strong>Partidas</strong> {total}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-neutral-700 bg-neutral-900/80">
                <strong>WR (Light)</strong> {wrL}%
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-neutral-700 bg-neutral-900/80">
                <strong>WR (Dark)</strong> {wrD}%
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-neutral-700 bg-neutral-900/80">
                <strong>Empates</strong> {draws}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-neutral-700 bg-neutral-900/80">
                <strong>Min (s)</strong> {(min/1000).toFixed(2)}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-neutral-700 bg-neutral-900/80">
                <strong>Máx (s)</strong> {(max/1000).toFixed(2)}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-neutral-700 bg-neutral-900/80">
                <strong>Total (s)</strong> {(sum/1000).toFixed(2)}
              </span>
            </>
          );
        })()}
      </div>

      <div className="rounded-lg border border-neutral-700 bg-neutral-900/60 p-3">
        <div className="section-title font-semibold text-neutral-200 mb-2">Resultados</div>
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
