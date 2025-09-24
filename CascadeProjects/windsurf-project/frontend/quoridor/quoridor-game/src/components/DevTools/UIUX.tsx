import { useAppDispatch, useAppSelector } from '../../store/hooks.ts';
import { setWallGap, toggleBoardWarp, resetBoardWarp, setBoardWarpVertex } from '../../store/uiSlice.ts';
import WallsHitBox from './WallsHitBox.tsx';

/**
 * UIUX — Panel de controles de UI/UX para desarrollo.
 * Incluye control del grosor de vallas (wallGap) en píxeles.
 */
export default function UIUX() {
  const dispatch = useAppDispatch();
  const wallGap = useAppSelector((s) => s.ui.wallGap);
  const warp = useAppSelector((s) => s.ui.boardWarp);

  const onChange = (v: number) => {
    dispatch(setWallGap(v));
  };

  return (
    <section className="rounded-lg border border-white/10 bg-gray-900/50 p-4">
      <h3 className="text-sm font-semibold mb-3">UI/UX</h3>
      {/* Grosor de vallas */}
      <div className="grid gap-3 sm:grid-cols-[1fr_auto] items-center">
        <label htmlFor="wallGap" className="text-xs text-gray-300">
          Grosor de vallas (px)
        </label>
        <div className="flex items-center gap-3">
          <input
            id="wallGap"
            type="range"
            min={8}
            max={32}
            step={1}
            value={wallGap}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-40"
          />
          <input
            type="number"
            min={8}
            max={32}
            step={1}
            value={wallGap}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-16 bg-gray-800 border border-white/10 rounded px-2 py-1 text-sm"
          />
        </div>
      </div>
      <p className="mt-2 text-[11px] text-gray-400">Consejo: un valor mayor facilita la selección en pantallas táctiles.</p>

      {/* Controles de hitbox en componente dedicado */}
      <div className="mt-4">
        <WallsHitBox />
      </div>

      {/* Warp del tablero */}
      <hr className="my-4 border-white/10" />
      <div className="mt-2 flex items-center justify-between gap-3">
        <div className="text-xs text-gray-300">Warp del tablero</div>
        <div className="flex items-center gap-2">
          <button
            className={[
              'px-2 py-1 rounded text-xs',
              warp.enabled ? 'bg-teal-700 hover:bg-teal-600' : 'bg-gray-800 hover:bg-gray-700',
            ].join(' ')}
            aria-pressed={warp.enabled}
            onClick={() => dispatch(toggleBoardWarp())}
          >
            {warp.enabled ? 'Warp: Activado' : 'Warp: Desactivado'}
          </button>
          <button
            className="px-2 py-1 rounded text-xs bg-gray-800 hover:bg-gray-700"
            onClick={() => dispatch(resetBoardWarp())}
            disabled={!warp.enabled}
            aria-disabled={!warp.enabled}
            title="Restablecer vértices a rectángulo"
          >
            Reset
          </button>
        </div>
      </div>
      {/* Vértices del warp */}
      <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(['tl','tr','br','bl'] as const).map((k) => (
          <fieldset key={k} className="border border-white/10 rounded p-2">
            <legend className="px-1 text-[11px] uppercase tracking-wide text-gray-400">{k.toUpperCase()}</legend>
            <label className="block text-[11px] text-gray-400 mb-1">X (0-100)</label>
            <input
              type="number"
              min={0}
              max={100}
              value={warp[k].x}
              onChange={(e) => dispatch(setBoardWarpVertex({ key: k, x: Number(e.target.value) }))}
              className="w-full bg-gray-800 border border-white/10 rounded px-2 py-1 text-xs"
              disabled={!warp.enabled}
            />
            <label className="block text-[11px] text-gray-400 mt-2 mb-1">Y (0-100)</label>
            <input
              type="number"
              min={0}
              max={100}
              value={warp[k].y}
              onChange={(e) => dispatch(setBoardWarpVertex({ key: k, y: Number(e.target.value) }))}
              className="w-full bg-gray-800 border border-white/10 rounded px-2 py-1 text-xs"
              disabled={!warp.enabled}
            />
          </fieldset>
        ))}
      </div>
    </section>
  );
}
