import { useMemo, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import type { RootState } from '../../../store';
import Button from '../../ui/Button';
import ToggleSwitch from '../../ui/ToggleSwitch';
import { aiSearchReset, aiSearchStarted, aiSearchProgress, aiSearchIter, aiSearchEnded, setAIUseWorkers, setAITimeMode, setAITimeSeconds, setAIDifficulty, applyIAPreset, setAiTimeMinMs, setAiTimeMaxMs, setAiTimeBaseMs, setAiTimePerMoveMs, setAiTimeExponent, setAiEnableTT, setAiFailSoft, setAiPreferHashMove, setAiEnablePVS, setAiEnableKillers, setAiEnableHistory, setAiEnableLMR, setAiLmrMinDepth, setAiLmrLateMoveIdx, setAiLmrReduction, setAIEvalWeights } from '../../../store/gameSlice';
import { store } from '../../../store';
import { findBestMove } from '../../../ia/search';
import PresetsTab from './components/Presets/PresetsTab';
import { loadPresets, type IAPreset } from '../../../ia/presets';

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
  const [activeTab, setActiveTab] = useState<'control' | 'analysis' | 'advanced' | 'presets'>('analysis');
  // Control-tab preset selector (same source as Presets CRUD)
  const [presetItems] = useState<IAPreset[]>(() => loadPresets());
  const [selectedPresetId, setSelectedPresetId] = useState<string>('');

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
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold text-neutral-300">IA • Panel</h3>
        <div className="text-[11px] text-neutral-400">
          {running ? <span className="kpi">Pensando…</span> : <span className="kpi kpi--muted">En espera</span>}
        </div>
      </div>
      <div className="flex items-center gap-2 mb-3" role="tablist" aria-label="Secciones del Panel de IA">
        <Button size="sm" variant={activeTab === 'control' ? 'primary' : 'neutral'} pressed={activeTab === 'control'} onClick={() => setActiveTab('control')} aria-label="Control">Control</Button>
        <Button size="sm" variant={activeTab === 'analysis' ? 'primary' : 'neutral'} pressed={activeTab === 'analysis'} onClick={() => setActiveTab('analysis')} aria-label="Análisis">Análisis</Button>
        <Button size="sm" variant={activeTab === 'advanced' ? 'primary' : 'neutral'} pressed={activeTab === 'advanced'} onClick={() => setActiveTab('advanced')} aria-label="Avanzado">Avanzado</Button>
        <Button size="sm" variant={activeTab === 'presets' ? 'primary' : 'neutral'} pressed={activeTab === 'presets'} onClick={() => setActiveTab('presets')} aria-label="Presets">Presets</Button>
      </div>

      {activeTab === 'control' && (
        <>
          {/* Preset selector + Difficulty + Time controls */}
          <div className="rounded-md border border-neutral-800/80 bg-neutral-900/60 p-2 mb-3">
            <div className="flex items-center gap-3 flex-wrap">
              <label className="text-xs text-neutral-300">Preset</label>
              <select
                value={selectedPresetId}
                onChange={(e) => setSelectedPresetId(e.target.value)}
                className="text-xs bg-neutral-800 border border-neutral-700 rounded px-2 py-1"
                aria-label="Preset de IA"
              >
                <option value="">(ninguno)</option>
                {presetItems.map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}
              </select>
              <Button
                size="sm"
                variant="neutral"
                disabled={!selectedPresetId}
                onClick={() => {
                  const found = presetItems.find(p => p.id === selectedPresetId);
                  if (found) dispatch(applyIAPreset(found.settings));
                }}
                title="Aplicar preset seleccionado"
              >Aplicar</Button>
              <div className="ml-auto" />
              <label className="text-xs text-neutral-300">Profundidad</label>
              <input
                type="number"
                min={1}
                max={20}
                step={1}
                value={ai?.difficulty ?? 3}
                onChange={(e) => dispatch(setAIDifficulty(Math.max(1, Math.min(20, Number(e.target.value)))))}
                className="w-16 text-xs bg-neutral-800 border border-neutral-700 rounded px-2 py-1"
                aria-label="Profundidad de búsqueda"
              />
              <label className="text-xs text-neutral-300">Tiempo</label>
              <div className="segmented" role="tablist" aria-label="Modo de tiempo">
                <button className={ai?.timeMode === 'auto' ? 'active' : ''} onClick={() => dispatch(setAITimeMode('auto'))}>Auto</button>
                <button className={ai?.timeMode === 'manual' ? 'active' : ''} onClick={() => dispatch(setAITimeMode('manual'))}>Manual</button>
              </div>
              {ai?.timeMode === 'manual' && (
                <label className="text-xs text-neutral-300 inline-flex items-center gap-2">
                  Segundos
                  <input
                    type="number"
                    min={0}
                    max={60}
                    step={1}
                    value={ai?.timeSeconds ?? 10}
                    onChange={(e) => dispatch(setAITimeSeconds(Math.max(0, Math.min(60, Number(e.target.value)))))}
                    className="w-16 text-xs bg-neutral-800 border border-neutral-700 rounded px-2 py-1"
                  />
                </label>
              )}
            </div>
          </div>
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
              <div className="mt-1 flex items-center justify-between">
                <div className="text-xs text-neutral-300">Usar Workers</div>
                <ToggleSwitch
                  checked={ai?.useWorkers !== false}
                  onChange={(v) => dispatch(setAIUseWorkers(v))}
                  offLabel="Off"
                  onLabel="On"
                />
              </div>
              <div className="mt-2 flex items-center gap-2">
                <Button size="sm" variant="primary" onClick={() => dispatch(aiSearchReset())}>Reset métricas</Button>
                <Button
                  size="sm"
                  variant="neutral"
                  onClick={async () => {
                    const state: RootState = store.getState();
                    const gs = state.game;
                    dispatch(aiSearchStarted(Date.now()));
                    if (gs.ai?.useWorkers === false) {
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
                      const w = new Worker(new URL('../../../ia/aiWorker.ts', import.meta.url), { type: 'module' });
                      w.onmessage = (msg: MessageEvent) => {
                        const data = msg.data as any;
                        if (data?.type === 'search_event') {
                          const ev = data.ev as any;
                          if (ev.type === 'progress') dispatch(aiSearchProgress(ev.nodesVisited));
                          else if (ev.type === 'iter') dispatch(aiSearchIter({ depth: ev.depth, score: ev.score }));
                          else if (ev.type === 'end') dispatch(aiSearchEnded({ durationMs: ev.durationMs, depthReached: ev.depthReached, score: ev.score, nodesVisited: ev.nodesVisited }));
                        } else if (data?.type === 'result') {
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
          </div>
        </>
      )}

      {activeTab === 'advanced' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Tiempo (Auto) */}
          <div className="rounded-md border border-neutral-800/80 bg-neutral-900/60 p-2">
            <h4 className="text-xs font-semibold text-neutral-300 mb-2">Tiempo (Auto)</h4>
            <div className="flex gap-3 flex-wrap">
              <label className="text-xs text-neutral-300 inline-flex items-center gap-2">minMs
                <input type="number" className="w-20 text-xs bg-neutral-800 border border-neutral-700 rounded px-2 py-1" value={ai?.aiTimeMinMs ?? 800} onChange={(e) => dispatch(setAiTimeMinMs(Number(e.target.value)))} />
              </label>
              <label className="text-xs text-neutral-300 inline-flex items-center gap-2">maxMs
                <input type="number" className="w-20 text-xs bg-neutral-800 border border-neutral-700 rounded px-2 py-1" value={ai?.aiTimeMaxMs ?? 8000} onChange={(e) => dispatch(setAiTimeMaxMs(Number(e.target.value)))} />
              </label>
              <label className="text-xs text-neutral-300 inline-flex items-center gap-2">baseMs
                <input type="number" className="w-24 text-xs bg-neutral-800 border border-neutral-700 rounded px-2 py-1" value={ai?.aiTimeBaseMs ?? (ai?.speed === 'rapido' ? 1200 : ai?.speed === 'lento' ? 5000 : 2500)} onChange={(e) => dispatch(setAiTimeBaseMs(Number(e.target.value)))} />
              </label>
              <label className="text-xs text-neutral-300 inline-flex items-center gap-2">perDepth
                <input type="number" className="w-20 text-xs bg-neutral-800 border border-neutral-700 rounded px-2 py-1" value={ai?.aiTimePerMoveMs ?? 300} onChange={(e) => dispatch(setAiTimePerMoveMs(Number(e.target.value)))} />
              </label>
              <label className="text-xs text-neutral-300 inline-flex items-center gap-2">exp
                <input type="number" step={0.1} className="w-16 text-xs bg-neutral-800 border border-neutral-700 rounded px-2 py-1" value={ai?.aiTimeExponent ?? 1.0} onChange={(e) => dispatch(setAiTimeExponent(Number(e.target.value)))} />
              </label>
            </div>
          </div>
          {/* Motor: toggles y LMR */}
          <div className="rounded-md border border-neutral-800/80 bg-neutral-900/60 p-2">
            <h4 className="text-xs font-semibold text-neutral-300 mb-2">Búsqueda base</h4>
            <div className="flex gap-3 flex-wrap mb-2">
              <label className="text-xs inline-flex items-center gap-2"><input type="checkbox" checked={ai?.enableTT !== false} onChange={(e) => dispatch(setAiEnableTT(e.target.checked))} /> TT</label>
              <label className="text-xs inline-flex items-center gap-2"><input type="checkbox" checked={!!ai?.failSoft} onChange={(e) => dispatch(setAiFailSoft(e.target.checked))} /> Fail-soft</label>
              <label className="text-xs inline-flex items-center gap-2"><input type="checkbox" checked={!!ai?.preferHashMove} onChange={(e) => dispatch(setAiPreferHashMove(e.target.checked))} /> Hash move</label>
              <label className="text-xs inline-flex items-center gap-2"><input type="checkbox" checked={ai?.enablePVS !== false} onChange={(e) => dispatch(setAiEnablePVS(e.target.checked))} /> PVS</label>
              <label className="text-xs inline-flex items-center gap-2"><input type="checkbox" checked={ai?.enableKillers !== false} onChange={(e) => dispatch(setAiEnableKillers(e.target.checked))} /> Killers</label>
              <label className="text-xs inline-flex items-center gap-2"><input type="checkbox" checked={ai?.enableHistory !== false} onChange={(e) => dispatch(setAiEnableHistory(e.target.checked))} /> History</label>
            </div>
            <h4 className="text-xs font-semibold text-neutral-300 mb-2">LMR</h4>
            <div className="flex gap-3 flex-wrap">
              <label className="text-xs inline-flex items-center gap-2"><input type="checkbox" checked={ai?.enableLMR !== false} onChange={(e) => dispatch(setAiEnableLMR(e.target.checked))} /> Enable LMR</label>
              <label className="text-xs text-neutral-300 inline-flex items-center gap-2">minDepth<input type="number" className="w-16 text-xs bg-neutral-800 border border-neutral-700 rounded px-2 py-1" value={ai?.lmrMinDepth ?? 3} onChange={(e) => dispatch(setAiLmrMinDepth(Number(e.target.value)))} /></label>
              <label className="text-xs text-neutral-300 inline-flex items-center gap-2">lateIdx<input type="number" className="w-16 text-xs bg-neutral-800 border border-neutral-700 rounded px-2 py-1" value={ai?.lmrLateMoveIdx ?? 3} onChange={(e) => dispatch(setAiLmrLateMoveIdx(Number(e.target.value)))} /></label>
              <label className="text-xs text-neutral-300 inline-flex items-center gap-2">reduction<input type="number" className="w-16 text-xs bg-neutral-800 border border-neutral-700 rounded px-2 py-1" value={ai?.lmrReduction ?? 1} onChange={(e) => dispatch(setAiLmrReduction(Number(e.target.value)))} /></label>
            </div>
          </div>
          {/* Heurística Global (aplica a ambos lados) */}
          <div className="rounded-md border border-neutral-800/80 bg-neutral-900/60 p-2 md:col-span-2">
            <h4 className="text-xs font-semibold text-neutral-300 mb-2">Heurística (global) • aplica a Light y Dark</h4>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
              {([
                ['w_race', 1.0],
                ['w_clash', 0.8],
                ['w_sprint', 0.6],
                ['w_block', 0.3],
              ] as const).map(([k, def]) => (
                <label key={k} className="text-xs text-neutral-300 inline-flex items-center gap-2">
                  {k}
                  <input
                    type="number"
                    step={0.1}
                    className="w-20 text-xs bg-neutral-800 border border-neutral-700 rounded px-2 py-1"
                    defaultValue={(ai?.evalWeights as any)?.Light?.[k] ?? (ai?.evalWeights as any)?.Dark?.[k] ?? def}
                    onBlur={(e) => {
                      const v = Number(e.target.value);
                      dispatch(setAIEvalWeights({ player: 'Light', weights: { [k]: v } as any }));
                      dispatch(setAIEvalWeights({ player: 'Dark', weights: { [k]: v } as any }));
                    }}
                  />
                </label>
              ))}
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 mt-2">
              <label className="text-xs text-neutral-300 inline-flex items-center gap-2">done_bonus
                <input
                  type="number"
                  step={0.5}
                  className="w-20 text-xs bg-neutral-800 border border-neutral-700 rounded px-2 py-1"
                  defaultValue={(ai?.evalWeights as any)?.Light?.done_bonus ?? (ai?.evalWeights as any)?.Dark?.done_bonus ?? 5.0}
                  onBlur={(e) => {
                    const v = Number(e.target.value);
                    dispatch(setAIEvalWeights({ player: 'Light', weights: { done_bonus: v } }));
                    dispatch(setAIEvalWeights({ player: 'Dark', weights: { done_bonus: v } }));
                  }}
                />
              </label>
              <label className="text-xs text-neutral-300 inline-flex items-center gap-2">sprint_thr
                <input
                  type="number"
                  step={1}
                  className="w-20 text-xs bg-neutral-800 border border-neutral-700 rounded px-2 py-1"
                  defaultValue={(ai?.evalWeights as any)?.Light?.sprint_threshold ?? (ai?.evalWeights as any)?.Dark?.sprint_threshold ?? 2}
                  onBlur={(e) => {
                    const v = Number(e.target.value);
                    dispatch(setAIEvalWeights({ player: 'Light', weights: { sprint_threshold: v } }));
                    dispatch(setAIEvalWeights({ player: 'Dark', weights: { sprint_threshold: v } }));
                  }}
                />
              </label>
              <label className="text-xs text-neutral-300 inline-flex items-center gap-2">tempo
                <input
                  type="number"
                  step={1}
                  className="w-20 text-xs bg-neutral-800 border border-neutral-700 rounded px-2 py-1"
                  defaultValue={(ai?.evalWeights as any)?.Light?.tempo ?? (ai?.evalWeights as any)?.Dark?.tempo ?? 5}
                  onBlur={(e) => {
                    const v = Number(e.target.value);
                    dispatch(setAIEvalWeights({ player: 'Light', weights: { tempo: v } }));
                    dispatch(setAIEvalWeights({ player: 'Dark', weights: { tempo: v } }));
                  }}
                />
              </label>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'analysis' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="rounded-md border border-neutral-800/80 bg-neutral-900/60 p-2">
            <Stat label="Nodos" value={ai?.nodesVisited ?? 0} />
            <Stat label="Profundidad" value={ai?.depthReached ?? 0} />
            <Stat label="Score" value={typeof ai?.lastScore === 'number' ? ai.lastScore : '-'} />
            <Stat label="Inicio" value={ai?.startedAt ? new Date(ai.startedAt).toLocaleTimeString() : '-'} />
            <Stat label="Hace" value={startedAgo} />
            <Stat label="Duración última" value={formattedDuration} />
          </div>
          <div className="rounded-md border border-neutral-800/80 bg-neutral-900/60 p-2">
            <h4 className="text-xs font-semibold text-neutral-300 mb-2">Engine • TT / Poda</h4>
            <Stat label="TT probes" value={ai?.engineStats?.ttProbes ?? 0} />
            <Stat label="TT hits" value={ai?.engineStats?.ttHits ?? 0} />
            <Stat label="Hit %" value={(ai?.engineStats?.ttProbes ? Math.round(100 * (ai?.engineStats?.ttHits || 0) / (ai?.engineStats?.ttProbes || 1)) : 0) + '%'} />
            <Stat label="Cutoffs" value={ai?.engineStats?.cutoffs ?? 0} />
          </div>
          <div className="rounded-md border border-neutral-800/80 bg-neutral-900/60 p-2">
            <h4 className="text-xs font-semibold text-neutral-300 mb-2">Engine • PVS/LMR</h4>
            <Stat label="PVS re-searches" value={ai?.engineStats?.pvsReSearches ?? 0} />
            <Stat label="LMR reductions" value={ai?.engineStats?.lmrReductions ?? 0} />
          </div>
        </div>
      )}

      {activeTab === 'presets' && (
        <div className="rounded-md border border-neutral-800/80 bg-neutral-900/60 p-2">
          <PresetsTab />
        </div>
      )}
    </div>
  );
}

