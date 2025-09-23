import type React from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks.ts';
import type { RootState } from '../../store/index.ts';
import { setDepth, toggleAutoplay, setPreset, toggleAIForL, toggleAIForD } from '../../store/iaSlice.ts';
import { useAI } from '../../ia/useAI.ts';

/**
 * IAUserPanel — Controles compactos para el usuario:
 * - Dificultad (profundidad)
 * - Botón "Mover IA"
 * - Toggle Autoplay (play/stop)
 *
 * Nota: la configuración de tiempo (auto/manual, segundos) se gestiona SOLO en IAPanel (DevTools).
 */
export default function IAUserPanel() {
  const dispatch = useAppDispatch();
  const ia = useAppSelector((s: RootState) => s.ia);
  const { requestAIMove, busy } = useAI();

  const onDepthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    dispatch(setDepth(Number(e.target.value)));
  };

  const canAIMove = !busy;

  return (
    <section className="rounded-lg border border-white/10 bg-gray-900/50 p-3" aria-label="Controles de IA">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <label htmlFor="ia-depth" className="text-sm">Dificultad</label>
          <select
            id="ia-depth"
            value={ia.depth}
            onChange={onDepthChange}
            className="bg-gray-800 text-gray-100 text-sm rounded-md px-2 py-1 border border-white/10"
          >
            {[1,2,3,4,5,6,7,8,9,10].map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        {/* Presets compactos: Balanceado / Agresivo / Defensivo */}
        <div className="inline-flex rounded-md overflow-hidden border border-white/10">
          {(['balanced','aggressive','defensive'] as const).map((p) => (
            <button
              key={p}
              className={[
                'px-3 py-1.5 text-sm',
                ia.preset === p ? 'bg-indigo-700 text-white' : 'bg-gray-800 text-gray-100 hover:bg-gray-700',
              ].join(' ')}
              onClick={() => dispatch(setPreset(p))}
              aria-pressed={ia.preset === p}
              title={p === 'balanced' ? 'Equilibrado' : p === 'aggressive' ? 'Agresivo' : 'Defensivo'}
            >
              {p === 'balanced' ? 'Balanceado' : p === 'aggressive' ? 'Agresivo' : 'Defensivo'}
            </button>
          ))}
        </div>

        {/* Control IA (compacto) */}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-xs text-gray-300">Control IA:</span>
          <label className="inline-flex items-center gap-1">
            <input type="checkbox" checked={ia.control.L} onChange={() => dispatch(toggleAIForL())} /> L
          </label>
          <label className="inline-flex items-center gap-1">
            <input type="checkbox" checked={ia.control.D} onChange={() => dispatch(toggleAIForD())} /> D
          </label>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button
            className="inline-flex items-center gap-2 rounded-md bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 text-sm text-white disabled:opacity-60"
            onClick={() => requestAIMove(true)}
            disabled={!canAIMove}
            title="Hacer que la IA juegue su turno"
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
      </div>
      {busy && (
        <div className="mt-2 text-xs text-gray-300">Pensando…</div>
      )}
    </section>
  );
}

