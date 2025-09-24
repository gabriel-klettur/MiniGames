import { useAppDispatch, useAppSelector } from '../../store/hooks.ts';
import {
  toggleWallHitboxes,
  setWallHitboxColor,
  toggleWallPreviewMonochrome,
  setWallHitboxOpacity,
  togglePreviewOnHoverWhenHidden,
  setWallHitboxShape,
  toggleExpandClickableWithShape,
  toggleRestrictClickToHitbox,
  setWallHitboxThicknessPx,
} from '../../store/uiSlice.ts';

export default function WallsHitBox() {
  const dispatch = useAppDispatch();
  const showWallHitboxes = useAppSelector((s) => s.ui.showWallHitboxes);
  const wallHitboxColor = useAppSelector((s) => s.ui.wallHitboxColor);
  const wallPreviewMonochrome = useAppSelector((s) => s.ui.wallPreviewMonochrome);
  const wallHitboxOpacity = useAppSelector((s) => s.ui.wallHitboxOpacity);
  const previewOnHoverWhenHidden = useAppSelector((s) => s.ui.previewOnHoverWhenHidden);
  const wallHitboxShape = useAppSelector((s) => s.ui.wallHitboxShape);
  const wallHitboxThicknessPx = useAppSelector((s) => s.ui.wallHitboxThicknessPx);
  const expandClickableWithShape = useAppSelector((s) => s.ui.expandClickableWithShape);
  const restrictClickToHitbox = useAppSelector((s) => s.ui.restrictClickToHitbox);

  return (
    <section className="rounded-lg border border-white/10 bg-gray-900/50 p-4">
      <h3 className="text-sm font-semibold mb-3">Hitbox de vallas</h3>

      {/* Visibilidad de hitbox */}
      <div className="mt-2 flex items-center justify-between gap-3">
        <label className="text-xs text-gray-300">Mostrar hitbox de vallas</label>
        <button
          className={['px-2 py-1 rounded text-xs', showWallHitboxes ? 'bg-emerald-700 hover:bg-emerald-600' : 'bg-gray-800 hover:bg-gray-700'].join(' ')}
          aria-pressed={showWallHitboxes}
          onClick={() => dispatch(toggleWallHitboxes())}
        >
          {showWallHitboxes ? 'Visible' : 'Oculto'}
        </button>
      </div>

      {/* Color base */}
      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] items-center">
        <label className="text-xs text-gray-300">Color de hitbox</label>
        <div className="flex items-center gap-2 flex-wrap">
          {(['purple','cyan','blue','emerald','amber','gray'] as const).map((c) => (
            <button
              key={c}
              className={[
                'px-2 py-1 rounded text-xs border border-white/10',
                c === 'purple' ? 'bg-purple-500/20 hover:bg-purple-500/30' :
                c === 'cyan'   ? 'bg-cyan-500/20 hover:bg-cyan-500/30'   :
                c === 'blue'   ? 'bg-blue-500/20 hover:bg-blue-500/30'   :
                c === 'emerald'? 'bg-emerald-500/20 hover:bg-emerald-500/30' :
                c === 'amber'  ? 'bg-amber-500/20 hover:bg-amber-500/30'   :
                                  'bg-gray-500/20 hover:bg-gray-500/30',
                wallHitboxColor === c ? 'ring-2 ring-white/40' : 'ring-0'
              ].join(' ')}
              aria-pressed={wallHitboxColor === c}
              onClick={() => dispatch(setWallHitboxColor(c))}
              title={c}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Preview monocromático */}
      <div className="mt-2 flex items-center justify-between gap-3">
        <label className="text-xs text-gray-300">Previsualización monocromática</label>
        <button
          className={['px-2 py-1 rounded text-xs', wallPreviewMonochrome ? 'bg-indigo-700 hover:bg-indigo-600' : 'bg-gray-800 hover:bg-gray-700'].join(' ')}
          aria-pressed={wallPreviewMonochrome}
          onClick={() => dispatch(toggleWallPreviewMonochrome())}
        >
          {wallPreviewMonochrome ? 'Activada' : 'Desactivada'}
        </button>
      </div>

      {/* Opacidad */}
      <div className="mt-2 grid gap-3 sm:grid-cols-[1fr_auto] items-center">
        <label className="text-xs text-gray-300">Opacidad del hitbox</label>
        <div className="flex items-center gap-2">
          {[10,20,30,40].map((v) => (
            <button
              key={v}
              className={['px-2 py-1 rounded text-xs border border-white/10', wallHitboxOpacity === v ? 'ring-2 ring-white/40' : 'ring-0'].join(' ')}
              onClick={() => dispatch(setWallHitboxOpacity(v as 10 | 20 | 30 | 40))}
              aria-pressed={wallHitboxOpacity === v}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Preview al hover cuando está oculto */}
      <div className="mt-2 flex items-center justify-between gap-3">
        <label className="text-xs text-gray-300">Preview al pasar el ratón cuando esté oculto</label>
        <button
          className={['px-2 py-1 rounded text-xs', previewOnHoverWhenHidden ? 'bg-indigo-700 hover:bg-indigo-600' : 'bg-gray-800 hover:bg-gray-700'].join(' ')}
          aria-pressed={previewOnHoverWhenHidden}
          onClick={() => dispatch(togglePreviewOnHoverWhenHidden())}
        >
          {previewOnHoverWhenHidden ? 'Activado' : 'Desactivado'}
        </button>
      </div>

      {/* Expandir click y restringir click */}
      <div className="mt-2 flex items-center justify-between gap-3">
        <label className="text-xs text-gray-300">Expandir área clickeable con el tamaño (beta)</label>
        <button
          className={['px-2 py-1 rounded text-xs', expandClickableWithShape ? 'bg-fuchsia-700 hover:bg-fuchsia-600' : 'bg-gray-800 hover:bg-gray-700'].join(' ')}
          aria-pressed={expandClickableWithShape}
          onClick={() => dispatch(toggleExpandClickableWithShape())}
        >
          {expandClickableWithShape ? 'Activado' : 'Desactivado'}
        </button>
      </div>

      <div className="mt-2 flex items-center justify-between gap-3">
        <label className="text-xs text-gray-300">Restringir clic al hitbox (exacto)</label>
        <button
          className={['px-2 py-1 rounded text-xs', restrictClickToHitbox ? 'bg-pink-700 hover:bg-pink-600' : 'bg-gray-800 hover:bg-gray-700'].join(' ')}
          aria-pressed={restrictClickToHitbox}
          onClick={() => dispatch(toggleRestrictClickToHitbox())}
        >
          {restrictClickToHitbox ? 'Activado' : 'Desactivado'}
        </button>
      </div>

      {/* Forma del hitbox (H/V) */}
      <div className="mb-2 mt-4">
        <h4 className="text-xs font-semibold mb-2 text-gray-200">Forma del hitbox</h4>
        {/* Horizontal (H) */}
        <fieldset className="border border-white/10 rounded p-3 mb-3">
          <legend className="px-1 text-[11px] uppercase tracking-wide text-gray-400">Horizontal (H)</legend>
          <div className="grid gap-2 sm:grid-cols-[1fr_auto] items-center">
            <label className="text-[11px] text-gray-300">Ancho (%)</label>
            <div className="flex items-center gap-2">
              <input type="range" min={1} max={500} step={1} value={wallHitboxShape.H.widthPct}
                     onChange={(e) => dispatch(setWallHitboxShape({ o: 'H', widthPct: Number(e.target.value) }))}
                     className="w-40" />
              <input type="number" min={1} max={500} step={1} value={wallHitboxShape.H.widthPct}
                     onChange={(e) => dispatch(setWallHitboxShape({ o: 'H', widthPct: Number(e.target.value) }))}
                     className="w-16 bg-gray-800 border border-white/10 rounded px-2 py-1 text-sm" />
            </div>
            <label className="text-[11px] text-gray-300">Alto (%)</label>
            <div className="flex items-center gap-2">
              <input type="range" min={1} max={500} step={1} value={wallHitboxShape.H.heightPct}
                     onChange={(e) => dispatch(setWallHitboxShape({ o: 'H', heightPct: Number(e.target.value) }))}
                     className="w-40" />
              <input type="number" min={1} max={500} step={1} value={wallHitboxShape.H.heightPct}
                     onChange={(e) => dispatch(setWallHitboxShape({ o: 'H', heightPct: Number(e.target.value) }))}
                     className="w-16 bg-gray-800 border border-white/10 rounded px-2 py-1 text-sm" />
            </div>
            <label className="text-[11px] text-gray-300">Grosor extra (px)</label>
            <div className="flex items-center gap-2">
              <input type="range" min={-50} max={50} step={1} value={wallHitboxThicknessPx.H}
                     onChange={(e) => dispatch(setWallHitboxThicknessPx({ o: 'H', px: Number(e.target.value) }))}
                     className="w-40" />
              <input type="number" min={-50} max={50} step={1} value={wallHitboxThicknessPx.H}
                     onChange={(e) => dispatch(setWallHitboxThicknessPx({ o: 'H', px: Number(e.target.value) }))}
                     className="w-16 bg-gray-800 border border-white/10 rounded px-2 py-1 text-sm" />
            </div>
          </div>
        </fieldset>

        {/* Vertical (V) */}
        <fieldset className="border border-white/10 rounded p-3">
          <legend className="px-1 text-[11px] uppercase tracking-wide text-gray-400">Vertical (V)</legend>
          <div className="grid gap-2 sm:grid-cols-[1fr_auto] items-center">
            <label className="text-[11px] text-gray-300">Ancho (%)</label>
            <div className="flex items-center gap-2">
              <input type="range" min={1} max={500} step={1} value={wallHitboxShape.V.widthPct}
                     onChange={(e) => dispatch(setWallHitboxShape({ o: 'V', widthPct: Number(e.target.value) }))}
                     className="w-40" />
              <input type="number" min={1} max={500} step={1} value={wallHitboxShape.V.widthPct}
                     onChange={(e) => dispatch(setWallHitboxShape({ o: 'V', widthPct: Number(e.target.value) }))}
                     className="w-16 bg-gray-800 border border-white/10 rounded px-2 py-1 text-sm" />
            </div>
            <label className="text-[11px] text-gray-300">Alto (%)</label>
            <div className="flex items-center gap-2">
              <input type="range" min={1} max={500} step={1} value={wallHitboxShape.V.heightPct}
                     onChange={(e) => dispatch(setWallHitboxShape({ o: 'V', heightPct: Number(e.target.value) }))}
                     className="w-40" />
              <input type="number" min={1} max={500} step={1} value={wallHitboxShape.V.heightPct}
                     onChange={(e) => dispatch(setWallHitboxShape({ o: 'V', heightPct: Number(e.target.value) }))}
                     className="w-16 bg-gray-800 border border-white/10 rounded px-2 py-1 text-sm" />
            </div>
            <label className="text-[11px] text-gray-300">Grosor extra (px)</label>
            <div className="flex items-center gap-2">
              <input type="range" min={-50} max={50} step={1} value={wallHitboxThicknessPx.V}
                     onChange={(e) => dispatch(setWallHitboxThicknessPx({ o: 'V', px: Number(e.target.value) }))}
                     className="w-40" />
              <input type="number" min={-50} max={50} step={1} value={wallHitboxThicknessPx.V}
                     onChange={(e) => dispatch(setWallHitboxThicknessPx({ o: 'V', px: Number(e.target.value) }))}
                     className="w-16 bg-gray-800 border border-white/10 rounded px-2 py-1 text-sm" />
            </div>
          </div>
        </fieldset>
      </div>
    </section>
  );
}

