import React from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks.ts';
import type { RootState } from '../../store/index.ts';
import { toggleAIForL, toggleAIForD, setSideDepth, setSideDifficultyPreset, setSideOpeningStrategy, setSideOpeningPliesMax, setSideOpeningFastEnabled, setSideOpeningFastPlies, setSideOpeningFastSeconds, setSidePreset, clearSideOverrides } from '../../store/iaSlice.ts';
import { useAI } from '../../ia/useAI.ts';
import TimeControls from './panel/TimeControls.tsx';
import RootMovesList from './panel/RootMovesList.tsx';
import Toolbar from './panel/Toolbar.tsx';
import EvaluationCard from './panel/EvaluationCard.tsx';
import ExtensibilityPanel from './panel/ExtensibilityPanel.tsx';
import TracePanel from './panel/TracePanel.tsx';

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
  const [tab, setTab] = React.useState<'ajustes' | 'viz'>(() => 'ajustes');
  const [playerTab, setPlayerTab] = React.useState<'L' | 'D'>(() => 'L');

  // (mantenemos helpers locales; TimeControls calcula su propio progreso)
  const openingLabels: Record<'central_control' | 'racing' | 'defensive' | 'mirror' | 'early_block', string> = {
    central_control: 'Control Central',
    racing: 'Carrera',
    defensive: 'Defensiva',
    mirror: 'Espejo',
    early_block: 'Muro Rápido',
  };
  const presetLabels: Record<'balanced' | 'aggressive' | 'defensive', string> = {
    balanced: 'Balanceado',
    aggressive: 'Agresivo',
    defensive: 'Defensivo',
  };

  return (
    <section className="rounded-lg border border-white/10 bg-gray-900/60 p-4 space-y-4" aria-label="IA (desarrollo)">
      <Toolbar onMoveIA={() => requestAIMove()} canMove={!busy && ia.control[game.current]} busy={busy} />

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10">
        <button
          className={[
            'px-3 py-2 text-sm rounded-t-md',
            tab === 'ajustes' ? 'bg-gray-800 text-white' : 'text-gray-300 hover:text-white'
          ].join(' ')}
          onClick={() => setTab('ajustes')}
        >Ajustes y análisis</button>
        <button
          className={[
            'px-3 py-2 text-sm rounded-t-md',
            tab === 'viz' ? 'bg-gray-800 text-white' : 'text-gray-300 hover:text-white'
          ].join(' ')}
          onClick={() => setTab('viz')}
        >Visualización</button>
      </div>

      {tab === 'ajustes' && (
        <>
          {/* Sub-tabs por jugador */}
          <div className="flex items-center justify-between">
            <div className="inline-flex rounded-md overflow-hidden border border-white/10">
              {(['L','D'] as const).map((p) => (
                <button
                  key={p}
                  className={[
                    'px-3 py-1.5 text-sm',
                    playerTab === p ? 'bg-gray-800 text-white' : 'bg-gray-900/40 text-gray-300 hover:text-white'
                  ].join(' ')}
                  onClick={() => setPlayerTab(p)}
                  aria-pressed={playerTab === p}
                  title={p === 'L' ? 'Configurar jugador Claras (L)' : 'Configurar jugador Oscuras (D)'}
                >{p === 'L' ? 'Jugador L' : 'Jugador D'}</button>
              ))}
            </div>
            <button
              className="px-3 py-1.5 text-xs rounded-md bg-gray-800 hover:bg-gray-700 text-gray-100 border border-white/10"
              title="Quitar overrides para este jugador (usará valores globales)"
              onClick={() => dispatch(clearSideOverrides(playerTab))}
            >Restablecer {playerTab}</button>
          </div>

          {/* Panel 1: Configuración de lados del tablero */}
          <section className="rounded-md border border-white/10 bg-gray-900/40 p-3 space-y-3" aria-label="Configuración de lados del tablero">
            <h4 className="text-xs font-semibold text-gray-300 uppercase tracking-wide">Configuración de lados del tablero</h4>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <label htmlFor="ia-depth-dev" className="text-sm">Profundidad</label>
                <select
                  id="ia-depth-dev"
                  value={(ia.bySide[playerTab].depth ?? ia.depth)}
                  onChange={(e) => dispatch(setSideDepth({ side: playerTab, value: Number(e.target.value) }))}
                  className="bg-gray-800 text-gray-100 text-sm rounded-md px-2 py-1 border border-white/10"
                >
                  {[1,2,3,4,5,6,7,8,9,10].map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              {/* Presets de dificultad: Novato / Intermedio / Bueno / Fuerte */}
              <div className="flex items-center gap-2">
                <span className="text-sm">Nivel</span>
                <div className="inline-flex rounded-md overflow-hidden border border-white/10">
                  {(['novato','intermedio','bueno','fuerte'] as const).map((p) => (
                    <button
                      key={p}
                      className={[
                        'px-3 py-1.5 text-sm',
                        (ia.bySide[playerTab].difficultyPreset ?? ia.difficultyPreset) === p ? 'bg-indigo-700 text-white' : 'bg-gray-800 text-gray-100 hover:bg-gray-700',
                      ].join(' ')}
                      onClick={() => dispatch(setSideDifficultyPreset({ side: playerTab, value: p }))}
                      aria-pressed={(ia.bySide[playerTab].difficultyPreset ?? ia.difficultyPreset) === p}
                      title={p === 'novato' ? 'Novato' : p === 'intermedio' ? 'Intermedio' : p === 'bueno' ? 'Bueno' : 'Fuerte'}
                    >
                      {p === 'novato' ? 'Novato' : p === 'intermedio' ? 'Intermedio' : p === 'bueno' ? 'Bueno' : 'Fuerte'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Comportamiento (balanceado/agresivo/defensivo/aleatorio) */}
              <div className="flex items-center gap-2">
                <span className="text-sm">Comportamiento</span>
                <select
                  value={(ia.bySide[playerTab].preset ?? ia.preset) ?? 'random'}
                  onChange={(e) => dispatch(setSidePreset({ side: playerTab, value: e.target.value as any }))}
                  className="bg-gray-800 text-gray-100 text-sm rounded-md px-2 py-1 border border-white/10"
                  title="Estilo de juego de la IA"
                >
                  <option value="random">Aleatorio</option>
                  <option value="balanced">Balanceado</option>
                  <option value="aggressive">Agresivo</option>
                  <option value="defensive">Defensivo</option>
                </select>
                {( (ia.bySide[playerTab].preset ?? ia.preset) === 'random') && ia.presetResolved && (
                  <span className="text-xs text-gray-300 px-2 py-1 rounded bg-gray-800/80 border border-white/10">
                    Aleatorio → {presetLabels[ia.presetResolved]}
                  </span>
                )}
              </div>

              {/* Aperturas: estrategia + plies de apertura */}
              <div className="flex items-center gap-2">
                <label htmlFor="ia-opening" className="text-sm">Apertura</label>
                <select
                  id="ia-opening"
                  value={(ia.bySide[playerTab].config?.openingStrategy ?? ia.config.openingStrategy) ?? ''}
                  onChange={(e) => dispatch(setSideOpeningStrategy({ side: playerTab, value: (e.target.value || undefined) as any }))}
                  className="bg-gray-800 text-gray-100 text-sm rounded-md px-2 py-1 border border-white/10"
                  title="Estrategia de apertura para los primeros turnos"
                >
                  <option value="random">Aleatorio</option>
                  <option value="central_control">Control Central</option>
                  <option value="racing">Carrera</option>
                  <option value="defensive">Defensiva</option>
                  <option value="mirror">Espejo</option>
                  <option value="early_block">Muro Rápido</option>
                </select>

                {((ia.bySide[playerTab].config?.openingStrategy ?? ia.config.openingStrategy) === 'random') && ia.openingResolved && (
                  <span className="text-xs text-gray-300 px-2 py-1 rounded bg-gray-800/80 border border-white/10">
                    Aleatoria → {openingLabels[ia.openingResolved]}
                  </span>
                )}

                <label htmlFor="ia-opening-plies" className="text-sm">Plies</label>
                <input
                  id="ia-opening-plies"
                  type="number"
                  min={0}
                  max={20}
                  value={(ia.bySide[playerTab].config?.openingPliesMax ?? ia.config.openingPliesMax) ?? 6}
                  onChange={(e) => dispatch(setSideOpeningPliesMax({ side: playerTab, value: Number(e.target.value) }))}
                  className="w-16 bg-gray-800 text-gray-100 text-sm rounded-md px-2 py-1 border border-white/10"
                  title="Duración aproximada de la fase de apertura (en medio-movimientos)"
                />
              </div>

              {/* Apertura rápida: primeros N movimientos con presupuesto fijo */}
              <div className="flex items-center gap-2">
                <label className="inline-flex items-center gap-2 text-sm" title="Limitar tiempo por jugada en los primeros N movimientos de la IA">
                  <input
                    type="checkbox"
                    checked={!!(ia.bySide[playerTab].config?.openingFastEnabled ?? ia.config.openingFastEnabled)}
                    onChange={(e) => dispatch(setSideOpeningFastEnabled({ side: playerTab, value: e.target.checked }))}
                  />
                  Apertura rápida
                </label>
                <label htmlFor="ia-opening-fast-plies" className="text-sm">Movs</label>
                <input
                  id="ia-opening-fast-plies"
                  type="number"
                  min={0}
                  max={10}
                  value={(ia.bySide[playerTab].config?.openingFastPlies ?? ia.config.openingFastPlies) ?? 3}
                  onChange={(e) => dispatch(setSideOpeningFastPlies({ side: playerTab, value: Number(e.target.value) }))}
                  className="w-16 bg-gray-800 text-gray-100 text-sm rounded-md px-2 py-1 border border-white/10"
                  title="Número de movimientos rápidos de IA desde el inicio"
                />
                <label htmlFor="ia-opening-fast-sec" className="text-sm">seg</label>
                <input
                  id="ia-opening-fast-sec"
                  type="number"
                  min={0}
                  max={5}
                  step={0.1}
                  value={(ia.bySide[playerTab].config?.openingFastSeconds ?? ia.config.openingFastSeconds) ?? 0.8}
                  onChange={(e) => dispatch(setSideOpeningFastSeconds({ side: playerTab, value: Number(e.target.value) }))}
                  className="w-20 bg-gray-800 text-gray-100 text-sm rounded-md px-2 py-1 border border-white/10"
                  title="Tiempo por jugada durante la apertura rápida"
                />
              </div>
            </div>
          </section>

          {/* Panel 2: Control de IA y tiempo de respuesta */}
          <section className="rounded-md border border-white/10 bg-gray-900/40 p-3 space-y-3" aria-label="Control de IA y tiempo de respuesta">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-gray-300 uppercase tracking-wide">Control de IA y tiempo de respuesta</h4>
              <div className="text-[11px] text-gray-400">Turno: {game.current === 'L' ? 'Claras (L)' : 'Oscuras (D)'}</div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs text-gray-300">Control IA:</span>
              <label className="inline-flex items-center gap-1 text-sm">
                <input type="checkbox" checked={ia.control.L} onChange={() => dispatch(toggleAIForL())} /> Claras (L)
              </label>
              <label className="inline-flex items-center gap-1 text-sm">
                <input type="checkbox" checked={ia.control.D} onChange={() => dispatch(toggleAIForD())} /> Oscuras (D)
              </label>
            </div>
            <TimeControls elapsedMs={stats.elapsedMs} side={playerTab} />
          </section>

          {/* Configuración avanzada */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <EvaluationCard />
            </div>

            <div className="space-y-3">
              <RootMovesList />
              <ExtensibilityPanel />
            </div>      
          </div>
        </>
      )}

      {tab === 'viz' && (
        <TracePanel />
      )}
    </section>
  );
}

