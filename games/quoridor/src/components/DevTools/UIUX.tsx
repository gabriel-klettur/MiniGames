import { useAppDispatch, useAppSelector } from '../../store/hooks.ts';
import { setWallGap, toggleBoardWarp, resetBoardWarp, setBoardWarpVertex } from '../../store/uiSlice.ts';
import WallsHitBox from './WallsHitBox.tsx';
import type { ReactNode } from 'react';

// Subcomponentes locales para consistencia visual y accesibilidad
function TogglePill({
  pressed,
  onClick,
  labelOn,
  labelOff,
  colorOn = 'bg-teal-700 hover:bg-teal-600',
  disabled,
  title,
}: {
  pressed: boolean;
  onClick: () => void;
  labelOn: string;
  labelOff: string;
  colorOn?: string;
  disabled?: boolean;
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
      disabled={disabled}
      aria-disabled={disabled}
      title={title}
    >
      {pressed ? labelOn : labelOff}
    </button>
  );
}

function SecondaryButton({
  children,
  onClick,
  disabled,
  title,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  title?: string;
}) {
  return (
    <button
      type="button"
      className="px-2 py-1 rounded text-xs bg-gray-800 hover:bg-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 disabled:opacity-50 disabled:cursor-not-allowed"
      onClick={onClick}
      disabled={disabled}
      aria-disabled={disabled}
      title={title}
    >
      {children}
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
  hint,
}: {
  id: string;
  label: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
  hint?: string;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-[1fr_auto] items-center">
      <label htmlFor={id} className="text-xs text-gray-300">
        {label}
      </label>
      <div className="flex items-center gap-3">
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
      {hint ? <p className="sm:col-span-2 mt-1 text-[11px] text-gray-400">{hint}</p> : null}
    </div>
  );
}

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
      <RangeNumberControl
        id="wallGap"
        label="Grosor de vallas (px)"
        min={8}
        max={32}
        step={1}
        value={wallGap}
        onChange={onChange}
        hint="Consejo: un valor mayor facilita la selección en pantallas táctiles."
      />

      {/* Controles de hitbox en componente dedicado */}
      <div className="mt-4">
        <WallsHitBox />
      </div>

      {/* Warp del tablero */}
      <hr className="my-4 border-white/10" />
      <div className="mt-2 flex items-center justify-between gap-3">
        <div className="text-xs text-gray-300">Warp del tablero</div>
        <div className="flex items-center gap-2">
          <TogglePill
            pressed={warp.enabled}
            onClick={() => dispatch(toggleBoardWarp())}
            labelOn="Warp: Activado"
            labelOff="Warp: Desactivado"
            colorOn="bg-teal-700 hover:bg-teal-600"
          />
          <SecondaryButton
            onClick={() => dispatch(resetBoardWarp())}
            disabled={!warp.enabled}
            title="Restablecer vértices a rectángulo"
          >
            Reset
          </SecondaryButton>
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

