import React from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks.ts';
import type { RootState } from '../../store/index.ts';
import { toggleAutoplay, toggleAIForL, toggleAIForD, setSideOpeningStrategy, setSideDifficultyPreset, setSidePreset } from '../../store/iaSlice.ts';
import { useAI } from '../../ia/useAI.ts';
import TimeControls from './panel/TimeControls.tsx';

/**
 * IAUserPanel — Controles compactos para el usuario:
 * - Nivel (Novato/Intermedio/Bueno/Fuerte)
 * - Botón "Mover IA"
 * - Toggle Autoplay (play/stop)
 * - Apertura (selección compacta)
 *
 * Nota: la configuración de tiempo (auto/manual, segundos) se gestiona SOLO en IAPanel (DevTools).
 */
export default function IAUserPanel() {
  const dispatch = useAppDispatch();
  const ia = useAppSelector((s: RootState) => s.ia);
  const game = useAppSelector((s: RootState) => s.game);
  const { requestAIMove, busy, stats } = useAI();
  const [playerTab, setPlayerTab] = React.useState<'L' | 'D'>(() => 'L');
  // Local UI state: show 'Aleatorio' by default; persist 'random' in store when chosen.
  const [openingSel, setOpeningSel] = React.useState<string>('random');
  React.useEffect(() => {
    // Mirror Redux: if store is 'random', show 'random'; else show concrete value (or '').
    const storeVal = (ia.bySide[playerTab].config?.openingStrategy ?? ia.config.openingStrategy) ?? '';
    setOpeningSel(storeVal === 'random' ? 'random' : storeVal);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ia.config.openingStrategy, ia.bySide[playerTab].config?.openingStrategy, playerTab]);

  const canAIMove = !busy && ia.control[game.current];
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
    <section className="" aria-label="Controles de IA">      
                   
      {/* Panel 1: Configuración de lados del tablero */}
      <section className="rounded-md border border-white/10 bg-gray-900/40 p-3 space-y-3" aria-label="Configuración de lados del tablero">        
        <div className="mb-2 flex items-center justify-between">
          {/* Sub-tabs por jugador (compacto) */}
          <div className="grid w-full grid-cols-2 rounded-md overflow-hidden border border-white/10">
            {(['L','D'] as const).map((p) => (
              <button
                key={p}
                className={[
                  'h-8 flex items-center justify-center text-sm', // ← altura unificada
                  playerTab === p
                    ? 'bg-gray-800 text-white'
                    : 'bg-gray-900/40 text-gray-300 hover:text-white'
                ].join(' ')}
                onClick={() => setPlayerTab(p)}
                aria-pressed={playerTab === p}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Apertura (compacto) */}
          <div className="flex items-center gap-2">
            <span className="text-sm">Apertura</span>
            <select
              value={openingSel}
              onChange={(e) => {
                const v = e.target.value;
                setOpeningSel(v);
                if (v === 'random') {
                  dispatch(setSideOpeningStrategy({ side: playerTab, value: 'random' as any }));
                } else {
                  dispatch(setSideOpeningStrategy({ side: playerTab, value: (v || undefined) as any }));
                }
              }}
              className="bg-gray-800 text-gray-100 text-sm rounded-md px-2 py-1 border border-white/10"
              title="Estrategia de apertura"
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
          </div>

          {/* Nivel (Novato / Intermedio / Bueno / Fuerte) */}
          <div className="flex items-center gap-2">          
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

          {/* Comportamiento (preset compacto) */}
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
            {((ia.bySide[playerTab].preset ?? ia.preset) === 'random') && ia.presetResolved && (
              <span className="text-xs text-gray-300 px-2 py-1 rounded bg-gray-800/80 border border-white/10">
                Aleatorio → {presetLabels[ia.presetResolved]}
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Panel 2: Control de IA y tiempo de respuesta */}
      <section className="mt-3 rounded-md border border-white/10 bg-gray-900/40 p-3 space-y-3" aria-label="Control de IA y tiempo de respuesta">
        <div className="flex items-center justify-between">                    
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Control IA (compacto) */}
          <div className="flex items-center gap-2 text-sm" aria-label="Control IA">
            <span className="text-xs text-gray-300">Control IA:</span>
            <label className="inline-flex items-center gap-1">
              <input type="checkbox" checked={ia.control.L} onChange={() => dispatch(toggleAIForL())} /> L
            </label>
            <label className="inline-flex items-center gap-1">
              <input type="checkbox" checked={ia.control.D} onChange={() => dispatch(toggleAIForD())} /> D
            </label>
          </div>

          <button
            className="inline-flex items-center gap-2 rounded-md bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 text-sm text-white disabled:opacity-60"
            onClick={() => requestAIMove(false)}
            disabled={!canAIMove}
            title={canAIMove ? "Hacer que la IA juegue su turno" : "IA no controla el turno actual"}
          >
            {/* Robot icon */}
            <svg className="" width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="currentColor" d="M11 2h2v3h-2z"/>
              <rect x="5" y="7" width="14" height="10" rx="2" ry="2" fill="none" stroke="currentColor" strokeWidth="1.5"/>
              <circle cx="9" cy="12" r="1.6" fill="currentColor"/>
              <circle cx="15" cy="12" r="1.6" fill="currentColor"/>
              <path fill="currentColor" d="M7 19h3v2H7zM14 19h3v2h-3z"/>
              <path fill="currentColor" d="M2 11h2v2H2zM20 11h2v2h-2z"/>
            </svg>
            Mover IA
          </button>

          <button
            className={[
              "inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm",
              ia.autoplay ? "bg-rose-700 hover:bg-rose-600 text-white" : "bg-gray-800 hover:bg-gray-700 text-gray-100",
              busy && !ia.autoplay ? "opacity-60" : "",
            ].join(' ')}
            onClick={() => dispatch(toggleAutoplay())}
            aria-pressed={ia.autoplay}
            disabled={busy && !ia.autoplay}
            title={ia.autoplay ? 'Detener autoplay de la IA' : 'Iniciar autoplay de la IA'}
          >
            {ia.autoplay ? (
              <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M6 6h12v12H6z"/></svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M8 5v14l11-7z"/></svg>
            )}
          </button>
        </div>
        <div className="mt-1">
          <TimeControls elapsedMs={stats.elapsedMs} showControls={false} capMode="full" side={playerTab} />
        </div>
      </section>
    </section>
  );
}

