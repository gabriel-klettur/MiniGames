import { useAppDispatch, useAppSelector } from '../../store/hooks.ts';
import type { RootState } from '../../store/index.ts';
import { setDepth, toggleAIForL, toggleAIForD } from '../../store/iaSlice.ts';
import { useAI } from '../../ia/useAI.ts';
import TimeControls from './panel/TimeControls.tsx';
import RootMovesList from './panel/RootMovesList.tsx';
import Toolbar from './panel/Toolbar.tsx';
import EvaluationCard from './panel/EvaluationCard.tsx';
import ExtensibilityPanel from './panel/ExtensibilityPanel.tsx';

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

  // (mantenemos helpers locales; TimeControls calcula su propio progreso)

  return (
    <section className="rounded-lg border border-white/10 bg-gray-900/60 p-4 space-y-4" aria-label="IA (desarrollo)">
      <Toolbar onMoveIA={() => requestAIMove()} canMove={!busy && ia.control[game.current]} busy={busy} />
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

        <TimeControls elapsedMs={stats.elapsedMs} />
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
          <EvaluationCard />
        </div>

        <div className="space-y-3">
          <RootMovesList />
          <ExtensibilityPanel />
        </div>      
      </div>
    </section>
  );
}

