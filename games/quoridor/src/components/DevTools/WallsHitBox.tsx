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
import type { ReactNode } from 'react';

// Subcomponentes locales para consistencia visual y accesibilidad
function TogglePill({
  pressed,
  onClick,
  labelOn,
  labelOff,
  colorOn,
  title,
}: {
  pressed: boolean;
  onClick: () => void;
  labelOn: string;
  labelOff: string;
  colorOn: string; // clases Tailwind cuando está activo
  title?: string;
}) {
  const base =
    'px-2 py-1 rounded text-xs transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 disabled:opacity-50 disabled:cursor-not-allowed';
  const off = 'bg-gray-800 hover:bg-gray-700';
  return (
    <button
      type="button"
      className={[base, pressed ? colorOn : off].join(' ')}
      aria-pressed={pressed}
      onClick={onClick}
      title={title}
    >
      {pressed ? labelOn : labelOff}
    </button>
  );
}

function RangeNumberControl({
  id,
  label,
  min,
  max,
  step = 1,
  value,
  onChange,
  disabled,
}: {
  id: string;
  label: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-[1fr_auto] items-center">
      <label htmlFor={id} className="text-[11px] text-gray-300">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-40"
          disabled={disabled}
          aria-disabled={disabled}
        />
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-16 bg-gray-800 border border-white/10 rounded px-2 py-1 text-sm"
          disabled={disabled}
          aria-disabled={disabled}
        />
      </div>
    </div>
  );
}

function SegmentedOptions<T extends string | number>({
  label,
  options,
  value,
  onSelect,
  renderLabel,
}: {
  label: string;
  options: readonly T[];
  value: T;
  onSelect: (v: T) => void;
  renderLabel?: (v: T) => ReactNode;
}) {
  return (
    <div className="mt-2 grid gap-3 sm:grid-cols-[1fr_auto] items-center">
      <span className="text-xs text-gray-300">{label}</span>
      <div className="flex items-center gap-2 flex-wrap">
        {options.map((opt) => (
          <button
            key={String(opt)}
            type="button"
            className={[
              'px-2 py-1 rounded text-xs border border-white/10',
              value === opt ? 'ring-2 ring-white/40 bg-gray-700' : 'bg-gray-800 hover:bg-gray-700',
            ].join(' ')}
            aria-pressed={value === opt}
            onClick={() => onSelect(opt)}
          >
            {renderLabel ? renderLabel(opt) : String(opt)}
          </button>
        ))}
      </div>
    </div>
  );
}

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
        <TogglePill
          pressed={showWallHitboxes}
          onClick={() => dispatch(toggleWallHitboxes())}
          labelOn="Visible"
          labelOff="Oculto"
          colorOn="bg-emerald-700 hover:bg-emerald-600"
        />
      </div>

      {/* Color base */}
      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] items-center">
        <label className="text-xs text-gray-300">Color de hitbox</label>
        <div className="flex items-center gap-2 flex-wrap">
          {(['purple','cyan','blue','emerald','amber','gray'] as const).map((c) => {
            const colorBg =
              c === 'purple' ? 'bg-purple-500/20 hover:bg-purple-500/30' :
              c === 'cyan'   ? 'bg-cyan-500/20 hover:bg-cyan-500/30'   :
              c === 'blue'   ? 'bg-blue-500/20 hover:bg-blue-500/30'   :
              c === 'emerald'? 'bg-emerald-500/20 hover:bg-emerald-500/30' :
              c === 'amber'  ? 'bg-amber-500/20 hover:bg-amber-500/30'   :
                                'bg-gray-500/20 hover:bg-gray-500/30';
            return (
              <button
                key={c}
                className={[
                  'px-2 py-1 rounded text-xs border border-white/10',
                  colorBg,
                  wallHitboxColor === c ? 'ring-2 ring-white/40' : 'ring-0'
                ].join(' ')}
                aria-pressed={wallHitboxColor === c}
                onClick={() => dispatch(setWallHitboxColor(c))}
                title={c}
              >
                {c}
              </button>
            );
          })}
        </div>
      </div>

      {/* Preview monocromático */}
      <div className="mt-2 flex items-center justify-between gap-3">
        <label className="text-xs text-gray-300">Previsualización monocromática</label>
        <TogglePill
          pressed={wallPreviewMonochrome}
          onClick={() => dispatch(toggleWallPreviewMonochrome())}
          labelOn="Activada"
          labelOff="Desactivada"
          colorOn="bg-indigo-700 hover:bg-indigo-600"
        />
      </div>

      {/* Opacidad */}
      <SegmentedOptions
        label="Opacidad del hitbox"
        options={[10, 20, 30, 40] as const}
        value={wallHitboxOpacity}
        onSelect={(v) => dispatch(setWallHitboxOpacity(v))}
      />

      {/* Preview al hover cuando está oculto */}
      <div className="mt-2 flex items-center justify-between gap-3">
        <label className="text-xs text-gray-300">Preview al pasar el ratón cuando esté oculto</label>
        <TogglePill
          pressed={previewOnHoverWhenHidden}
          onClick={() => dispatch(togglePreviewOnHoverWhenHidden())}
          labelOn="Activado"
          labelOff="Desactivado"
          colorOn="bg-indigo-700 hover:bg-indigo-600"
        />
      </div>

      {/* Expandir click y restringir click */}
      <div className="mt-2 flex items-center justify-between gap-3">
        <label className="text-xs text-gray-300">Expandir área clickeable con el tamaño (beta)</label>
        <TogglePill
          pressed={expandClickableWithShape}
          onClick={() => dispatch(toggleExpandClickableWithShape())}
          labelOn="Activado"
          labelOff="Desactivado"
          colorOn="bg-fuchsia-700 hover:bg-fuchsia-600"
        />
      </div>

      <div className="mt-2 flex items-center justify-between gap-3">
        <label className="text-xs text-gray-300">Restringir clic al hitbox (exacto)</label>
        <TogglePill
          pressed={restrictClickToHitbox}
          onClick={() => dispatch(toggleRestrictClickToHitbox())}
          labelOn="Activado"
          labelOff="Desactivado"
          colorOn="bg-pink-700 hover:bg-pink-600"
        />
      </div>

      {/* Forma del hitbox (H/V) */}
      <div className="mb-2 mt-4">
        <h4 className="text-xs font-semibold mb-2 text-gray-200">Forma del hitbox</h4>
        {/* Horizontal (H) */}
        <fieldset className="border border-white/10 rounded p-3 mb-3">
          <legend className="px-1 text-[11px] uppercase tracking-wide text-gray-400">Horizontal (H)</legend>
          <div className="grid gap-2">
            <RangeNumberControl
              id="hitbox-H-width"
              label="Ancho (%)"
              min={1}
              max={500}
              step={1}
              value={wallHitboxShape.H.widthPct}
              onChange={(v) => dispatch(setWallHitboxShape({ o: 'H', widthPct: v }))}
            />
            <RangeNumberControl
              id="hitbox-H-height"
              label="Alto (%)"
              min={1}
              max={500}
              step={1}
              value={wallHitboxShape.H.heightPct}
              onChange={(v) => dispatch(setWallHitboxShape({ o: 'H', heightPct: v }))}
            />
            <RangeNumberControl
              id="hitbox-H-thickness"
              label="Grosor extra (px)"
              min={-50}
              max={50}
              step={1}
              value={wallHitboxThicknessPx.H}
              onChange={(v) => dispatch(setWallHitboxThicknessPx({ o: 'H', px: v }))}
            />
            {/* Preset de forma para H */}
            <SegmentedOptions
              label="Preset (H)"
              options={["rect","diamond","hex6"] as const}
              value={(wallHitboxShape as any).H?.preset ?? 'rect'}
              onSelect={(v) => dispatch(setWallHitboxShape({ o: 'H', preset: v } as any))}
              renderLabel={(v) => (v === 'rect' ? 'Rectángulo' : v === 'diamond' ? 'Rombo' : v === 'hex6' ? 'Hexágono 6' : String(v))}
            />
            {((wallHitboxShape as any).H?.preset ?? 'rect') === 'hex6' && (
              <>
                <RangeNumberControl
                  id="hitbox-H-hex-a"
                  label="Hex (a%) — desplazamiento grosor (0-50)"
                  min={0}
                  max={50}
                  step={1}
                  value={(wallHitboxShape as any).H?.hex?.aPct ?? 50}
                  onChange={(v) => dispatch(setWallHitboxShape({ o: 'H', hexA_pct: v } as any))}
                />
                <RangeNumberControl
                  id="hitbox-H-hex-b"
                  label="Hex (b%) — avance longitudinal (0-50)"
                  min={0}
                  max={50}
                  step={1}
                  value={(wallHitboxShape as any).H?.hex?.bPct ?? 20}
                  onChange={(v) => dispatch(setWallHitboxShape({ o: 'H', hexB_pct: v } as any))}
                />
              </>
            )}
          </div>
        </fieldset>

        {/* Vertical (V) */}
        <fieldset className="border border-white/10 rounded p-3">
          <legend className="px-1 text-[11px] uppercase tracking-wide text-gray-400">Vertical (V)</legend>
          <div className="grid gap-2">
            <RangeNumberControl
              id="hitbox-V-width"
              label="Ancho (%)"
              min={1}
              max={500}
              step={1}
              value={wallHitboxShape.V.widthPct}
              onChange={(v) => dispatch(setWallHitboxShape({ o: 'V', widthPct: v }))}
            />
            <RangeNumberControl
              id="hitbox-V-height"
              label="Alto (%)"
              min={1}
              max={500}
              step={1}
              value={wallHitboxShape.V.heightPct}
              onChange={(v) => dispatch(setWallHitboxShape({ o: 'V', heightPct: v }))}
            />
            <RangeNumberControl
              id="hitbox-V-thickness"
              label="Grosor extra (px)"
              min={-50}
              max={50}
              step={1}
              value={wallHitboxThicknessPx.V}
              onChange={(v) => dispatch(setWallHitboxThicknessPx({ o: 'V', px: v }))}
            />
            {/* Preset de forma para V */}
            <SegmentedOptions
              label="Preset (V)"
              options={["rect","diamond","hex6"] as const}
              value={(wallHitboxShape as any).V?.preset ?? 'rect'}
              onSelect={(v) => dispatch(setWallHitboxShape({ o: 'V', preset: v } as any))}
              renderLabel={(v) => (v === 'rect' ? 'Rectángulo' : v === 'diamond' ? 'Rombo' : v === 'hex6' ? 'Hexágono 6' : String(v))}
            />
            {((wallHitboxShape as any).V?.preset ?? 'rect') === 'hex6' && (
              <>
                <RangeNumberControl
                  id="hitbox-V-hex-a"
                  label="Hex (a%) — desplazamiento grosor (0-50)"
                  min={0}
                  max={50}
                  step={1}
                  value={(wallHitboxShape as any).V?.hex?.aPct ?? 50}
                  onChange={(v) => dispatch(setWallHitboxShape({ o: 'V', hexA_pct: v } as any))}
                />
                <RangeNumberControl
                  id="hitbox-V-hex-b"
                  label="Hex (b%) — avance longitudinal (0-50)"
                  min={0}
                  max={50}
                  step={1}
                  value={(wallHitboxShape as any).V?.hex?.bPct ?? 20}
                  onChange={(v) => dispatch(setWallHitboxShape({ o: 'V', hexB_pct: v } as any))}
                />
              </>
            )}
          </div>
        </fieldset>
      </div>
    </section>
  );
}

