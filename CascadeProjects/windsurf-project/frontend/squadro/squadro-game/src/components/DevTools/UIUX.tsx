import { useAppDispatch, useAppSelector } from '../../store/hooks';
import type { RootState } from '../../store';
import { setCalibrationOverlay, setCalibrationOriginX, setCalibrationOriginY, setCalibrationPitchScaleX, setCalibrationPitchScaleY, setShowCoordsOverlay, setShowPipIndicators, setPieceScale } from '../../store/gameSlice';
import Button from '../ui/Button';

export default function UIUX() {
  const dispatch = useAppDispatch();
  const cal = useAppSelector((s: RootState) => s.game.ui.calibration) ?? { originX: 0, originY: 0, pitchScaleX: 1, pitchScaleY: 1, showOverlay: false };
  const showCoords = useAppSelector((s: RootState) => s.game.ui.showCoordsOverlay) ?? false;
  const showPips = useAppSelector((s: RootState) => s.game.ui.showPipIndicators) ?? false;
  const pieceScale = useAppSelector((s: RootState) => s.game.ui.pieceScale) ?? 0.7;
  const MIN_ORIGIN = -100;
  const MAX_ORIGIN = 100;
  const MIN_SCALE = 0.8;
  const MAX_SCALE = 1.2;

  return (
    <div className="mt-3 w-full rounded-lg border border-neutral-800 bg-neutral-900/70 p-3 overflow-hidden">
      <h3 className="text-xs font-semibold text-neutral-300 mb-2">Calibración de Tablero</h3>

      {/* Debug Overlays toggles */}
      <div className="mb-3 flex flex-wrap items-center gap-4">
        <label className="inline-flex items-center gap-2 text-xs text-neutral-300">
          <input
            type="checkbox"
            checked={showCoords}
            onChange={(e) => dispatch(setShowCoordsOverlay(e.target.checked))}
            className="accent-blue-400"
          />
          Mostrar coordenadas (rX,cY)
        </label>
        <label className="inline-flex items-center gap-2 text-xs text-neutral-300">
          <input
            type="checkbox"
            checked={showPips}
            onChange={(e) => dispatch(setShowPipIndicators(e.target.checked))}
            className="accent-blue-400"
          />
          Mostrar indicadores (pips)
        </label>
      </div>
      {/* Overlay toggle */}
      <div className="flex items-center gap-2 mb-3">
        <Button
          size="sm"
          variant={cal.showOverlay ? 'primary' : 'neutral'}
          onClick={() => dispatch(setCalibrationOverlay(!cal.showOverlay))}
          title="Mostrar/Ocultar overlay de intersecciones"
        >
          {cal.showOverlay ? 'Ocultar overlay' : 'Mostrar overlay'}
        </Button>
        <div className="text-[11px] text-neutral-500">Muestra puntos en cada intersección para alinear sprites.</div>
      </div>

      {/* Origin X */}
      <div className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-2 w-full">
        <label className="text-xs text-neutral-400 whitespace-nowrap">Origen X</label>
        <input
          type="range"
          min={MIN_ORIGIN}
          max={MAX_ORIGIN}
          step={1}
          value={cal.originX}
          onChange={(e) => dispatch(setCalibrationOriginX(Number(e.target.value)))}
          className="min-w-0 w-full accent-blue-400"
          aria-label="Origen X (slider)"
        />
        <input
          type="number"
          min={MIN_ORIGIN}
          max={MAX_ORIGIN}
          step={1}
          value={cal.originX}
          onChange={(e) => dispatch(setCalibrationOriginX(Number(e.target.value)))}
          className="w-14 rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1 text-xs text-neutral-100 text-center"
          aria-label="Origen X (px)"
        />
        <Button size="sm" variant="neutral" onClick={() => dispatch(setCalibrationOriginX(0))}>Reset</Button>
      </div>
      <div className="text-[11px] text-neutral-500 mt-2">Offset X: {cal.originX}px (rango {MIN_ORIGIN}..{MAX_ORIGIN})</div>

      {/* Origin Y */}
      <div className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-2 w-full mt-4">
        <label className="text-xs text-neutral-400 whitespace-nowrap">Origen Y</label>
        <input
          type="range"
          min={MIN_ORIGIN}
          max={MAX_ORIGIN}
          step={1}
          value={cal.originY}
          onChange={(e) => dispatch(setCalibrationOriginY(Number(e.target.value)))}
          className="min-w-0 w-full accent-blue-400"
          aria-label="Origen Y (slider)"
        />
        <input
          type="number"
          min={MIN_ORIGIN}
          max={MAX_ORIGIN}
          step={1}
          value={cal.originY}
          onChange={(e) => dispatch(setCalibrationOriginY(Number(e.target.value)))}
          className="w-14 rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1 text-xs text-neutral-100 text-center"
          aria-label="Origen Y (px)"
        />
        <Button size="sm" variant="neutral" onClick={() => dispatch(setCalibrationOriginY(0))}>Reset</Button>
      </div>
      <div className="text-[11px] text-neutral-500 mt-2">Offset Y: {cal.originY}px (rango {MIN_ORIGIN}..{MAX_ORIGIN})</div>

      {/* Pitch scale X */}
      <div className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-2 w-full mt-4">
        <label className="text-xs text-neutral-400 whitespace-nowrap">Escala de Pitch X</label>
        <input
          type="range"
          min={MIN_SCALE}
          max={MAX_SCALE}
          step={0.005}
          value={cal.pitchScaleX}
          onChange={(e) => dispatch(setCalibrationPitchScaleX(Number(e.target.value)))}
          className="min-w-0 w-full accent-blue-400"
          aria-label="Escala de pitch X (slider)"
        />
        <input
          type="number"
          min={MIN_SCALE}
          max={MAX_SCALE}
          step={0.01}
          value={cal.pitchScaleX}
          onChange={(e) => dispatch(setCalibrationPitchScaleX(Number(e.target.value)))}
          className="w-16 rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1 text-xs text-neutral-100 text-center"
          aria-label="Escala de pitch X (factor)"
        />
        <Button size="sm" variant="neutral" onClick={() => dispatch(setCalibrationPitchScaleX(1))}>Reset</Button>
      </div>
      <div className="text-[11px] text-neutral-500 mt-2">Pitch X = base × {cal.pitchScaleX.toFixed(3)} (rango {MIN_SCALE}..{MAX_SCALE})</div>

      {/* Pitch scale Y */}
      <div className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-2 w-full mt-4">
        <label className="text-xs text-neutral-400 whitespace-nowrap">Escala de Pitch Y</label>
        <input
          type="range"
          min={MIN_SCALE}
          max={MAX_SCALE}
          step={0.005}
          value={cal.pitchScaleY}
          onChange={(e) => dispatch(setCalibrationPitchScaleY(Number(e.target.value)))}
          className="min-w-0 w-full accent-blue-400"
          aria-label="Escala de pitch Y (slider)"
        />
        <input
          type="number"
          min={MIN_SCALE}
          max={MAX_SCALE}
          step={0.01}
          value={cal.pitchScaleY}
          onChange={(e) => dispatch(setCalibrationPitchScaleY(Number(e.target.value)))}
          className="w-16 rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1 text-xs text-neutral-100 text-center"
          aria-label="Escala de pitch Y (factor)"
        />
        <Button size="sm" variant="neutral" onClick={() => dispatch(setCalibrationPitchScaleY(1))}>Reset</Button>
      </div>
      <div className="text-[11px] text-neutral-500 mt-2">Pitch Y = base × {cal.pitchScaleY.toFixed(3)} (rango {MIN_SCALE}..{MAX_SCALE})</div>

      {/* Piece Scale */}
      <div className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-2 w-full mt-5">
        <label className="text-xs text-neutral-400 whitespace-nowrap">Tamaño de ficha</label>
        <input
          type="range"
          min={0.3}
          max={2.0}
          step={0.01}
          value={pieceScale}
          onChange={(e) => dispatch(setPieceScale(Number(e.target.value)))}
          className="min-w-0 w-full accent-amber-400"
          aria-label="Escala de ficha (slider)"
        />
        <input
          type="number"
          min={0.3}
          max={2.0}
          step={0.01}
          value={pieceScale}
          onChange={(e) => dispatch(setPieceScale(Number(e.target.value)))}
          className="w-16 rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1 text-xs text-neutral-100 text-center"
          aria-label="Escala de ficha (factor)"
        />
        <Button size="sm" variant="neutral" onClick={() => dispatch(setPieceScale(0.7))}>Reset</Button>
      </div>
      <div className="text-[11px] text-neutral-500 mt-2">Ancho = base × {pieceScale.toFixed(2)} (rango 0.30..2.00)</div>
    </div>
  );
}

