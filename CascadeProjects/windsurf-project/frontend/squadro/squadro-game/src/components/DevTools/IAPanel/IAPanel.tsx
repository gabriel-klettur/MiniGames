import { useMemo, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import type { RootState } from '../../../store';
import Button from '../../ui/Button';
import ToggleSwitch from '../../ui/ToggleSwitch';
import { aiSearchReset, aiSearchStarted, aiSearchProgress, aiSearchIter, aiSearchEnded, setAIUseWorkers, setAITimeMode, setAITimeSeconds, setAIDifficulty, applyIAPreset, setAiTimeMinMs, setAiTimeMaxMs, setAiTimeBaseMs, setAiTimePerMoveMs, setAiTimeExponent, setAiEnableTT, setAiFailSoft, setAiPreferHashMove, setAiEnablePVS, setAiEnableKillers, setAiEnableHistory, setAiEnableLMR, setAiEnableQuiescence, setAiQuiescenceDepth, setAiLmrMinDepth, setAiLmrLateMoveIdx, setAiLmrReduction, setAIEvalWeights, setAiOrderingJitterEps } from '../../../store/gameSlice';
import { store } from '../../../store';
import { findBestMove } from '../../../ia/search';
import PresetsTab from './components/Presets/PresetsTab';
import { loadPresets, type IAPreset } from '../../../ia/presets';

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
        <Button size="sm" variant={activeTab === 'control' ? 'primary' : 'neutral'} pressed={activeTab === 'control'} onClick={() => setActiveTab('control')} aria-label="Control" title="Control — Ajustes inmediatos para jugar: aplica un preset, fija profundidad y modo de tiempo. Ejemplo: selecciona 'IAPowa+Rendimiento', profundidad 5 y Tiempo=Auto.">Control</Button>
        <Button size="sm" variant={activeTab === 'analysis' ? 'primary' : 'neutral'} pressed={activeTab === 'analysis'} onClick={() => setActiveTab('analysis')} aria-label="Análisis" title="Análisis — KPIs de rendimiento (nodos, profundidad, TT, PVS/LMR) para validar el motor. Ejemplo: compara NPS y % de hits TT entre builds.">Análisis</Button>
        <Button size="sm" variant={activeTab === 'advanced' ? 'primary' : 'neutral'} pressed={activeTab === 'advanced'} onClick={() => setActiveTab('advanced')} aria-label="Avanzado" title="Avanzado — Parámetros finos del motor: Tiempo (Auto), TT/PVS/LMR y Heurística global. Ejemplo: sube perDepth o activa LMR para acelerar.">Avanzado</Button>
        <Button size="sm" variant={activeTab === 'presets' ? 'primary' : 'neutral'} pressed={activeTab === 'presets'} onClick={() => setActiveTab('presets')} aria-label="Presets" title="Presets — Crear/duplicar/renombrar presets y aplicarlos. Ejemplo: guarda 'IAPowa+Defensa' y compártelo con InfoIA.">Presets</Button>
      </div>

      {activeTab === 'control' && (
        <>
          {/* Preset selector + Difficulty + Time controls */}
          <div className="rounded-md border border-neutral-800/80 bg-neutral-900/60 p-2 mb-3">
            <div className="flex items-center gap-3 flex-wrap">
              <label className="text-xs text-neutral-300" title="Preset — Conjunto de ajustes de IA guardados (profundidad, tiempo, workers…). Ejemplo: 'Rendimiento' prioriza velocidad; 'Defensa' ajusta heurística.">Preset</label>
              <select
                value={selectedPresetId}
                onChange={(e) => setSelectedPresetId(e.target.value)}
                className="text-xs bg-neutral-800 border border-neutral-700 rounded px-2 py-1"
                aria-label="Preset de IA"
                title="Selecciona un preset — Carga sus parámetros en el estado actual (no modifica el preset). Ejemplo: aplicar 'IAPowa' establece profundidad y tiempos sugeridos."
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
                title="Aplicar — Copia los ajustes del preset al jugador actual. Ejemplo: cambia profundidad/tiempo y toggles sin afectar otros presets."
              >Aplicar</Button>
              <div className="ml-auto" />
              <label className="text-xs text-neutral-300" title="Profundidad — Objetivo de plies para iterative deepening. Ejemplo: 5 implica explorar 5 medias-jugadas (ply) salvo límites de tiempo.">Profundidad</label>
              <input
                type="number"
                min={1}
                max={20}
                step={1}
                value={ai?.difficulty ?? 3}
                onChange={(e) => dispatch(setAIDifficulty(Math.max(1, Math.min(20, Number(e.target.value)))))}
                className="w-16 text-xs bg-neutral-800 border border-neutral-700 rounded px-2 py-1"
                aria-label="Profundidad de búsqueda"
                title="Profundidad objetivo — Límite deseado; la iterativa puede quedarte en d-1 si el tiempo no alcanza. Ejemplo: fija 4–6 para partidas rápidas."
              />
              <label className="text-xs text-neutral-300" title="Tiempo — Elige Auto (adaptativo) o Manual (segundos fijos por jugada).">Tiempo</label>
              <div className="segmented" role="tablist" aria-label="Modo de tiempo">
                <button className={ai?.timeMode === 'auto' ? 'active' : ''} onClick={() => dispatch(setAITimeMode('auto'))} title="Auto — Sin límite fijo; usa parámetros de Tiempo (Auto) para decidir cuándo parar (profundidad/aspiration windows). Ejemplo: baseMs=2500, perDepth=300.">Auto</button>
                <button className={ai?.timeMode === 'manual' ? 'active' : ''} onClick={() => dispatch(setAITimeMode('manual'))} title="Manual — Límite duro de segundos por jugada. Ejemplo: 10s asegura timebox estable para pruebas comparables.">Manual</button>
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
                    title="Segundos (Manual) — Límite de tiempo por movimiento. Ejemplo: 5s acelera; 30s permite profundidad mayor a costa de latencia."
                  />
                </label>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="rounded-md border border-neutral-800/80 bg-neutral-900/60 p-2">
              <Stat label="Estado" title="Estado — Inactivo o Pensando. Ejemplo: 'Pensando' durante una búsqueda; vuelve a 'Inactivo' al terminar o cancelar." value={
                <span className={`inline-flex items-center gap-2 ${running ? 'text-emerald-300' : 'text-neutral-300'}`}>
                  <span className={`inline-block w-2 h-2 rounded-full ${running ? 'bg-emerald-400' : 'bg-neutral-500'}`} />
                  {running ? 'Pensando' : 'Inactivo'}
                </span>
              } />
              <Stat label="Turno" title="Turno — Quién mueve ahora (Light/Dark). Ejemplo: algunas heurísticas suman 'tempo' al que juega." value={turn} />
              <Stat label="Lado IA" title="Lado IA — Bando controlado por la IA (Light/Dark). Ejemplo: verifica coherencia de signos del score al alternar lados." value={ai?.aiSide ?? '-'} />
              <Stat label="Dificultad" title="Dificultad — Profundidad objetivo (plies). Ejemplo: 5 ⇒ busca hasta 5 plies si el tiempo alcanza." value={ai?.difficulty ?? '-'} />
              <Stat label="Velocidad" title="Velocidad — Perfil de tiempo (rápido/normal/lento/auto). Ejemplo: 'rápido' reduce baseMs; 'lento' lo incrementa." value={ai?.speed ?? '-'} />
              <Stat label="Modo tiempo" title="Modo tiempo — Auto usa presupuesto adaptativo; Manual aplica segundos fijos." value={ai?.timeMode ?? '-'} />
              {ai?.timeMode === 'manual' && <Stat label="Segundos" title="Segundos — Límite por jugada en modo Manual." value={ai?.timeSeconds ?? '-'} />}
              <Stat label="Profundidad objetivo" title="Profundidad objetivo — Límite deseado de iterativa; puede quedarse en d-1 si el tiempo expira." value={typeof targetDepth === 'number' ? targetDepth : '-'} />
              <Stat label="Límite de tiempo" title="Límite de tiempo — En VS IA puede ser 'Ilimitado' (Infinity)." value={timeLimitLabel} />
            </div>
            <div className="rounded-md border border-neutral-800/80 bg-neutral-900/60 p-2" title="Ejecución en Web Workers y utilidades de diagnóstico">
              <div className="mt-1 flex items-center justify-between">
                <div className="text-xs text-neutral-300" title="Usar Workers — Ejecuta en Web Workers para aislar CPU de la UI y habilitar paralelización de raíz. Ejemplo: ON en multi‑núcleo, OFF para depurar.">Usar Workers</div>
                <ToggleSwitch
                  checked={ai?.useWorkers !== false}
                  onChange={(v) => dispatch(setAIUseWorkers(v))}
                  offLabel="Off"
                  onLabel="On"
                  title="Activar/Desactivar ejecución en Web Worker"
                />
              </div>
              <div className="mt-2 flex items-center gap-2">
                <Button size="sm" variant="primary" onClick={() => dispatch(aiSearchReset())} title="Reset métricas — Pone a cero nodos, profundidad, score y tiempos. Útil antes de un nuevo bench.">Reset métricas</Button>
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
                  title="Bench rápido — Búsqueda corta (200ms, d=2) para validar progreso y métricas. Ejemplo: tras cambiar TT/PVS/LMR, comprueba NPS/cutoffs."
                >
                  Probar búsqueda (bench)
                </Button>
                <Button
                  size="sm"
                  variant="neutral"
                  className="bg-red-800 text-red-100 border-red-600 hover:bg-red-700 focus:ring-red-400/30"
                  onClick={() => { try { (window as any).__squadroCancelAI?.(); } catch {} }}
                  disabled={!ai?.busy}
                  title="Cancelar búsqueda — Solicita detener la búsqueda lo antes posible sin congelar la UI."
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
          <div className="rounded-md border border-neutral-800/80 bg-neutral-900/60 p-2" title="Tiempo (Auto) — Presupuesto adaptativo por jugada. Ejemplo: baseMs=2500, perDepth=300, exp=1.0; limitado por minMs/maxMs.">
            <h4 className="text-xs font-semibold text-neutral-300 mb-2">Tiempo (Auto)</h4>
            <div className="flex gap-3 flex-wrap">
              <label className="text-xs text-neutral-300 inline-flex items-center gap-2" title="minMs — Tiempo mínimo (ms) por jugada en Auto. Ejemplo: evita que jugadas triviales gasten menos de 800ms.">minMs
                <input type="number" className="w-20 text-xs bg-neutral-800 border border-neutral-700 rounded px-2 py-1" value={ai?.aiTimeMinMs ?? 800} onChange={(e) => dispatch(setAiTimeMinMs(Number(e.target.value)))} />
              </label>
              <label className="text-xs text-neutral-300 inline-flex items-center gap-2" title="maxMs — Tiempo máximo (ms) por jugada en Auto. Ejemplo: tope de 8000ms para posiciones complejas.">maxMs
                <input type="number" className="w-20 text-xs bg-neutral-800 border border-neutral-700 rounded px-2 py-1" value={ai?.aiTimeMaxMs ?? 8000} onChange={(e) => dispatch(setAiTimeMaxMs(Number(e.target.value)))} />
              </label>
              <label className="text-xs text-neutral-300 inline-flex items-center gap-2" title="baseMs — Presupuesto base (ms) según velocidad (rápido/normal/lento). Ejemplo: normal≈2500ms.">baseMs
                <input type="number" className="w-24 text-xs bg-neutral-800 border border-neutral-700 rounded px-2 py-1" value={ai?.aiTimeBaseMs ?? (ai?.speed === 'rapido' ? 1200 : ai?.speed === 'lento' ? 5000 : 2500)} onChange={(e) => dispatch(setAiTimeBaseMs(Number(e.target.value)))} />
              </label>
              <label className="text-xs text-neutral-300 inline-flex items-center gap-2" title="perDepth — Incremento de ms por cada unidad de profundidad objetivo. Ejemplo: +300ms por profundidad.">perDepth
                <input type="number" className="w-20 text-xs bg-neutral-800 border border-neutral-700 rounded px-2 py-1" value={ai?.aiTimePerMoveMs ?? 300} onChange={(e) => dispatch(setAiTimePerMoveMs(Number(e.target.value)))} />
              </label>
              <label className="text-xs text-neutral-300 inline-flex items-center gap-2" title="exp — Exponente de crecimiento (>=1). Ejemplo: 1.0 lineal, 1.2 sube más rápido con profundidad.">exp
                <input type="number" step={0.1} className="w-16 text-xs bg-neutral-800 border border-neutral-700 rounded px-2 py-1" value={ai?.aiTimeExponent ?? 1.0} onChange={(e) => dispatch(setAiTimeExponent(Number(e.target.value)))} />
              </label>
            </div>
          </div>
          {/* Motor: toggles y LMR */}
          <div className="rounded-md border border-neutral-800/80 bg-neutral-900/60 p-2" title="Motor — TT/Fail-soft/Hash move/PVS/Killers/History y LMR. Ajusta para balancear poda, ordenación y precisión.">
            <h4 className="text-xs font-semibold text-neutral-300 mb-2">Búsqueda base</h4>
            <div className="flex gap-3 flex-wrap mb-2">
              <label className="text-xs inline-flex items-center gap-2" title="TT — Cachea evaluaciones por hash de posición; evita recalcular transposiciones. Ej.: A→B→C y D→E→C reutilizan C."><input type="checkbox" checked={ai?.enableTT !== false} onChange={(e) => dispatch(setAiEnableTT(e.target.checked))} /> TT</label>
              <label className="text-xs inline-flex items-center gap-2" title="Fail-soft — Permite propagar valores fuera de ventana para mejorar cortes y ordenación en iterativas."><input type="checkbox" checked={!!ai?.failSoft} onChange={(e) => dispatch(setAiFailSoft(e.target.checked))} /> Fail-soft</label>
              <label className="text-xs inline-flex items-center gap-2" title="Hash move — Prioriza la jugada recomendada por TT para generar cutoffs tempranos."><input type="checkbox" checked={!!ai?.preferHashMove} onChange={(e) => dispatch(setAiPreferHashMove(e.target.checked))} /> Hash move</label>
              <label className="text-xs inline-flex items-center gap-2" title="PVS — Ventana nula en no‑PV con re‑búsqueda si supera α. Acelera sobre αβ estándar."><input type="checkbox" checked={ai?.enablePVS !== false} onChange={(e) => dispatch(setAiEnablePVS(e.target.checked))} /> PVS</label>
              <label className="text-xs inline-flex items-center gap-2" title="Killers — Jugadas que cortaron β en este ply se prueban antes en ramas hermanas."><input type="checkbox" checked={ai?.enableKillers !== false} onChange={(e) => dispatch(setAiEnableKillers(e.target.checked))} /> Killers</label>
              <label className="text-xs inline-flex items-center gap-2" title="History — Puntos por éxito histórico elevan prioridad en el orden."><input type="checkbox" checked={ai?.enableHistory !== false} onChange={(e) => dispatch(setAiEnableHistory(e.target.checked))} /> History</label>
              <label className="text-xs inline-flex items-center gap-2" title="Quiescence — Extiende hojas tácticas (capturas) para estabilizar la evaluación y evitar blunders."><input type="checkbox" checked={!!ai?.enableQuiescence} onChange={(e) => dispatch(setAiEnableQuiescence(e.target.checked))} /> Quiescence</label>
            </div>
            <div className="flex gap-3 flex-wrap mt-1">
              <label className="text-xs text-neutral-300 inline-flex items-center gap-2" title="orderingJitterEps — Ruido leve en la prioridad del orden para romper empates deterministas. 0 desactiva; valores típicos 0.5–2.0.">
                jitter
                <input type="number" step={0.1} className="w-20 text-xs bg-neutral-800 border border-neutral-700 rounded px-2 py-1" value={ai?.orderingJitterEps ?? 0} onChange={(e) => dispatch(setAiOrderingJitterEps(Number(e.target.value)))} />
              </label>
            </div>
            <h4 className="text-xs font-semibold text-neutral-300 mb-2">LMR</h4>
            <div className="flex gap-3 flex-wrap">
              <label className="text-xs inline-flex items-center gap-2" title="Enable LMR — Reduce profundidad en jugadas no tácticas y tardías; re‑busca a profundidad completa si fallan alto."><input type="checkbox" checked={ai?.enableLMR !== false} onChange={(e) => dispatch(setAiEnableLMR(e.target.checked))} /> Enable LMR</label>
              <label className="text-xs text-neutral-300 inline-flex items-center gap-2" title="minDepth — Profundidad mínima a partir de la cual considerar reducciones. Ej.: con 3 solo aplica cuando depth≥3">minDepth<input type="number" className="w-16 text-xs bg-neutral-800 border border-neutral-700 rounded px-2 py-1" value={ai?.lmrMinDepth ?? 3} onChange={(e) => dispatch(setAiLmrMinDepth(Number(e.target.value)))} /></label>
              <label className="text-xs text-neutral-300 inline-flex items-center gap-2" title="lateIdx — Considera 'jugada tardía' desde este índice en el orden. Ej.: 3 ⇒ desde el 4º movimiento.">lateIdx<input type="number" className="w-16 text-xs bg-neutral-800 border border-neutral-700 rounded px-2 py-1" value={ai?.lmrLateMoveIdx ?? 3} onChange={(e) => dispatch(setAiLmrLateMoveIdx(Number(e.target.value)))} /></label>
              <label className="text-xs text-neutral-300 inline-flex items-center gap-2" title="reduction — Plies a reducir en jugadas tardías no tácticas. Ej.: 1 ⇒ d-1 (con re‑búsqueda si supera α).">reduction<input type="number" className="w-16 text-xs bg-neutral-800 border border-neutral-700 rounded px-2 py-1" value={ai?.lmrReduction ?? 1} onChange={(e) => dispatch(setAiLmrReduction(Number(e.target.value)))} /></label>
              <label className="text-xs text-neutral-300 inline-flex items-center gap-2" title="qPlies — Límite de extensiones de Quiescence (tácticas) en hojas.">qPlies<input type="number" className="w-16 text-xs bg-neutral-800 border border-neutral-700 rounded px-2 py-1" value={(ai as any)?.quiescenceDepth ?? 4} onChange={(e) => dispatch(setAiQuiescenceDepth(Number(e.target.value)))} /></label>
            </div>
          </div>
          {/* Heurística Global (aplica a ambos lados) */}
          <div className="rounded-md border border-neutral-800/80 bg-neutral-900/60 p-2 md:col-span-2" title="Pesos globales de la función de evaluación (aplican a Light y Dark)">
            <h4 className="text-xs font-semibold text-neutral-300 mb-2">Heurística (global) • aplica a Light y Dark</h4>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
              {([
                ['w_race', 1.0],
                ['w_clash', 0.8],
                ['w_sprint', 0.6],
                ['w_block', 0.3],
              ] as const).map(([k, def]) => (
                <label key={k} className="text-xs text-neutral-300 inline-flex items-center gap-2" title={k === 'w_race' ? 'w_race — Carrera: recompensa menos turnos restantes. Ej.: si tú 6 y rival 8, un w_race alto favorece tu posición.' : k === 'w_clash' ? 'w_clash — Choques inminentes y swings de turnos. Ej.: enviar atrás una pieza rival sin quedarte expuesto aumenta el score.' : k === 'w_sprint' ? 'w_sprint — Sprint final: incentiva cerrar con piezas a pocos turnos del objetivo. Se activa junto a sprint_thr.' : 'w_block — Bloqueos útiles vs exposición inmediata. Ej.: tapar rutas rivales y evitar quedar al alcance siguiente.'}>
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
              <label className="text-xs text-neutral-300 inline-flex items-center gap-2" title="done_bonus — Bonus por piezas ya retiradas. Ej.: cada pieza completada suma este bonus, además de la carrera acumulada.">done_bonus
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
              <label className="text-xs text-neutral-300 inline-flex items-center gap-2" title="sprint_thr — Umbral de turnos que activa el sprint. Ej.: con 2, piezas a 1–2 turnos disparan el término de sprint.">sprint_thr
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
              <label className="text-xs text-neutral-300 inline-flex items-center gap-2" title="tempo — Iniciativa: bonus suave cuando es tu turno para preferir líneas que mantienen presión.">tempo
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
          <div className="rounded-md border border-neutral-800/80 bg-neutral-900/60 p-2" title="Resumen de métricas de búsqueda — Usa estos KPIs para validar rendimiento (NPS) y profundidad alcanzada por iterativa.">
            <Stat label="Nodos" title="Nodos — Total de posiciones visitadas en la última búsqueda. Ejemplo: si ves 120k en 2s, tu NPS ≈ 60k/s; compáralo entre builds o con/ sin LMR." value={ai?.nodesVisited ?? 0} />
            <Stat label="Profundidad" title="Profundidad — Ply máximo alcanzado (iterative deepening). Ejemplo: en 10s deberías ver subir 1→2→3… hasta estabilizar en d objetivo." value={ai?.depthReached ?? 0} />
            <Stat label="Score" title="Score — Evaluación heurística relativa al jugador actual; positivo favorece a quien mueve. Ejemplo: +200 indica ligera ventaja; mira si la PV sugiere jugada coherente con el signo." value={typeof ai?.lastScore === 'number' ? ai.lastScore : '-'} />
            <Stat label="Inicio" title="Inicio — Hora de comienzo de la última búsqueda. Ejemplo: útil al correr varios benches seguidos para identificar runs." value={ai?.startedAt ? new Date(ai.startedAt).toLocaleTimeString() : '-'} />
            <Stat label="Hace" title="Hace — Tiempo transcurrido desde inicio. Ejemplo: '250 ms ago' permite saber si estás viendo datos frescos del último run." value={startedAgo} />
            <Stat label="Duración última" title="Duración — Tiempo total del último run. Ejemplo: cruzado con Nodos te permite estimar NPS (Nodos / s)." value={formattedDuration} />
          </div>
          <div className="rounded-md border border-neutral-800/80 bg-neutral-900/60 p-2" title="TT (Transposition Table) y Poda — Cuantifica consultas, aciertos y cortes beta para evaluar eficiencia de memoria y ordenación.">
            <h4 className="text-xs font-semibold text-neutral-300 mb-2" title="TT / Poda — Más aciertos (hits) y mayor % implican mejor reutilización; más cutoffs implican mejor ordenación y poda αβ temprana.">Engine • TT / Poda</h4>
            <Stat label="TT probes" title="TT probes — Consultas totales a la tabla de transposiciones. Ejemplo: debe crecer con Nodos; si es muy bajo, revisa hashing/zobrist o claves de acceso." value={ai?.engineStats?.ttProbes ?? 0} />
            <Stat label="TT hits" title="TT hits — Veces que la posición estaba en TT. Ejemplo: un número alto implica buen reuso y menos re-evaluaciones." value={ai?.engineStats?.ttHits ?? 0} />
            <Stat label="Hit %" title="Hit % — Porcentaje de aciertos TT (hits/probes). Ejemplo: ≥30% suele ser sano; si es <10% quizá falte TT store o colisiona el hash." value={(ai?.engineStats?.ttProbes ? Math.round(100 * (ai?.engineStats?.ttHits || 0) / (ai?.engineStats?.ttProbes || 1)) : 0) + '%'} />
            <Stat label="Cutoffs" title="Cutoffs — Cortes β logrados por poda αβ. Ejemplo: al mejorar orden de movimientos (hash move/killers/history) los cutoffs suben y la búsqueda acelera." value={ai?.engineStats?.cutoffs ?? 0} />
          </div>
          <div className="rounded-md border border-neutral-800/80 bg-neutral-900/60 p-2" title="PVS/LMR — Mide re-búsquedas y reducciones aplicadas para entender el trade-off entre velocidad y precisión.">
            <h4 className="text-xs font-semibold text-neutral-300 mb-2" title="PVS/LMR — Re-búsquedas PVS deberían existir pero no ser excesivas; LMR reductions altas aceleran pero pueden requerir re-búsqueda cuando fallan alto.">Engine • PVS/LMR</h4>
            <Stat label="PVS re-searches" title="PVS re-searches — Veces que una ventana nula falló alto y se re-buscó con ventana completa. Ejemplo: algunas re-búsquedas son normales; demasiadas indican ordering subóptimo." value={ai?.engineStats?.pvsReSearches ?? 0} />
            <Stat label="LMR reductions" title="LMR reductions — Reducciones aplicadas a jugadas tardías no tácticas. Ejemplo: valores mayores aceleran pero si el score mejora α se re-busca a profundidad completa." value={ai?.engineStats?.lmrReductions ?? 0} />
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

