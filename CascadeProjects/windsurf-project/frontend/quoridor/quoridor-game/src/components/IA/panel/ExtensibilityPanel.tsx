import { useAppDispatch, useAppSelector } from '../../../store/hooks.ts';
import type { RootState } from '../../../store/index.ts';
import {
  resetConfigToDefaults,
  setAspirationWindow,
  setEnableAlphaBeta,
  setEnableAspirationWindows,
  setEnableHistoryHeuristic,
  setEnableIterative,
  setEnableKillerHeuristic,
  setEnableLMR,
  setEnableMoveOrdering,
  setEnablePVS,
  setEnableQuiescence,
  setEnableTT,
  setEnableWallPathFilter,
  setEnableWorker,
  setHardTimeLimit,
  setMaxWallsNode,
  setMaxWallsRoot,
  setQuiescenceMaxPlies,
  setRandomTieBreak,
  setReserveWallsMin,
  setTTSize,
  setWallMeritLambda,
  setWallPathRadius,
  setWallVsPawnTauBase,
} from '../../../store/iaSlice.ts';
import { useEffect, useState } from 'react';

export default function ExtensibilityPanel() {
  const dispatch = useAppDispatch();
  const ia = useAppSelector((s: RootState) => s.ia);

  const [open, setOpen] = useState<boolean>(() => {
    try {
      const v = localStorage.getItem('qa.extensibility.open');
      return v ? JSON.parse(v) : true;
    } catch {
      return true;
    }
  });
  useEffect(() => {
    try { localStorage.setItem('qa.extensibility.open', JSON.stringify(open)); } catch {}
  }, [open]);

  return (
    <details className="pt-2 border-t border-white/10" open={open} onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)}>
      <summary className="cursor-pointer text-sm font-medium list-none flex items-center justify-between py-1">
        <span>Extensibilidad (Dev)</span>
        <span className="text-xs text-gray-400">clic para contraer/expandir</span>
      </summary>
      <div className="space-y-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" checked={ia.config.enableMoveOrdering} onChange={(e) => dispatch(setEnableMoveOrdering(e.target.checked))} />
          Ordenar jugadas
        </label>
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" checked={ia.config.enableAlphaBeta} onChange={(e) => dispatch(setEnableAlphaBeta(e.target.checked))} />
          Poda Alpha-Beta
        </label>
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" checked={!!ia.config.enableWorker} onChange={(e) => dispatch(setEnableWorker(e.target.checked))} />
          Ejecutar IA en Worker
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
        {/* Heurística de vallas */}
        <div className="flex items-center gap-2">
          <span>λ vallas</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={Number(ia.config.wallMeritLambda ?? 0)}
            onChange={(e) => dispatch(setWallMeritLambda(Number(e.target.value)))}
            className="flex-1"
          />
          <span className="w-12 text-right">{Number(ia.config.wallMeritLambda ?? 0).toFixed(2)}</span>
        </div>
        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={!!ia.config.enableWallPathFilter}
            onChange={(e) => dispatch(setEnableWallPathFilter(e.target.checked))}
          />
          Filtrar vallas por ruta
        </label>
        <div className="flex items-center gap-2">
          <span>Radio ruta</span>
          <input
            className="w-20 bg-gray-800 border border-white/10 rounded px-2 py-1"
            type="number"
            min={0}
            max={4}
            value={Number(ia.config.wallPathRadius ?? 0)}
            onChange={(e) => dispatch(setWallPathRadius(Number(e.target.value)))}
          />
        </div>
        {/* Optimización de búsqueda */}
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" checked={!!ia.config.enableKillerHeuristic} onChange={(e) => dispatch(setEnableKillerHeuristic(e.target.checked))} />
          Killer moves
        </label>
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" checked={!!ia.config.enableHistoryHeuristic} onChange={(e) => dispatch(setEnableHistoryHeuristic(e.target.checked))} />
          History heuristic
        </label>
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" checked={!!ia.config.enableQuiescence} onChange={(e) => dispatch(setEnableQuiescence(e.target.checked))} />
          Quiescence
        </label>
        <div className="flex items-center gap-2">
          <span>Quiescence plies</span>
          <input
            className="w-20 bg-gray-800 border border-white/10 rounded px-2 py-1"
            type="number"
            min={0}
            max={4}
            value={Number(ia.config.quiescenceMaxPlies ?? 0)}
            onChange={(e) => dispatch(setQuiescenceMaxPlies(Number(e.target.value)))}
          />
        </div>
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" checked={!!ia.config.enableLMR} onChange={(e) => dispatch(setEnableLMR(e.target.checked))} />
          LMR (reducción tardía)
        </label>
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" checked={!!ia.config.enablePVS} onChange={(e) => dispatch(setEnablePVS(e.target.checked))} />
          PVS (Principal Variation Search)
        </label>
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" checked={!!ia.config.enableAspirationWindows} onChange={(e) => dispatch(setEnableAspirationWindows(e.target.checked))} />
          Ventanas de aspiración
        </label>
        <div className="flex items-center gap-2">
          <span>Tamaño ventana</span>
          <input
            className="w-20 bg-gray-800 border border-white/10 rounded px-2 py-1"
            type="number"
            step={0.1}
            min={0}
            max={5}
            value={Number(ia.config.aspirationWindow ?? 0)}
            onChange={(e) => dispatch(setAspirationWindow(Number(e.target.value)))}
          />
        </div>
        {/* Priorización valla vs movimiento (raíz) */}
        <div className="flex items-center gap-2">
          <span>τ base valla/peón</span>
          <input
            className="w-24 bg-gray-800 border border-white/10 rounded px-2 py-1"
            type="number"
            step={0.05}
            min={0}
            max={3}
            value={Number(ia.config.wallVsPawnTauBase ?? 0)}
            onChange={(e) => dispatch(setWallVsPawnTauBase(Number(e.target.value)))}
          />
        </div>
        <div className="flex items-center gap-2">
          <span>Reservar vallas</span>
          <input
            className="w-20 bg-gray-800 border border-white/10 rounded px-2 py-1"
            type="number"
            min={0}
            max={10}
            value={Number(ia.config.reserveWallsMin ?? 0)}
            onChange={(e) => dispatch(setReserveWallsMin(Number(e.target.value)))}
          />
        </div>
        <div className="col-span-1 sm:col-span-2 pt-2">
          <button
            className="rounded-md bg-gray-800 hover:bg-gray-700 border border-white/10 px-3 py-1.5 text-xs text-gray-100"
            onClick={() => dispatch(resetConfigToDefaults())}
            title="Restablecer parámetros avanzados a valores por defecto"
          >
            Restablecer configuración
          </button>
        </div>
      </div>
    </details>
  );
}
