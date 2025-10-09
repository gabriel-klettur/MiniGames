import React from 'react';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks.ts';
import type { RootState } from '../../../../store/index.ts';
import Button from '../../../ui/Button.tsx';
import { setCalibrationOverlay, setCalibrationOriginX, setCalibrationOriginY, setCalibrationPitchScaleX, setCalibrationPitchScaleY, setShowCoordsOverlay, setShowPipIndicators } from '../../../../store/gameSlice.ts';
import { MIN_ORIGIN, MAX_ORIGIN, MIN_SCALE, MAX_SCALE } from '../utils/constants.ts';
import ControlRow from '../components/ControlRow.tsx';

export default function CalibrationPanel() {
  const dispatch = useAppDispatch();
  const cal = useAppSelector((s: RootState) => s.game.ui.calibration) ?? { originX: 0, originY: 0, pitchScaleX: 1, pitchScaleY: 1, showOverlay: false };
  const showCoords = useAppSelector((s: RootState) => s.game.ui.showCoordsOverlay) ?? false;
  const showPips = useAppSelector((s: RootState) => s.game.ui.showPipIndicators) ?? false;

  return (
    <>
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
      <ControlRow
        label="Origen X"
        value={cal.originX}
        onChange={(v) => dispatch(setCalibrationOriginX(v))}
        min={MIN_ORIGIN}
        max={MAX_ORIGIN}
        sliderStep={1}
        buttonStep={1}
        inputStep={1}
        accentClass="accent-blue-400"
        ariaLabelSlider="Origen X (slider)"
        ariaLabelDec="Decrementar Origen X"
        ariaLabelInc="Incrementar Origen X"
        ariaLabelInput="Origen X (px)"
        minusTitle="-1 px"
        plusTitle={"+1 px"}
        resetValue={0}
        numberInputWidthClass="w-14"
      />
      <div className="text-[11px] text-neutral-500 mt-2">Offset X: {cal.originX}px (rango {MIN_ORIGIN}..{MAX_ORIGIN})</div>

      {/* Origin Y */}
      <div className="mt-4">
        <ControlRow
          label="Origen Y"
          value={cal.originY}
          onChange={(v) => dispatch(setCalibrationOriginY(v))}
          min={MIN_ORIGIN}
          max={MAX_ORIGIN}
          sliderStep={1}
          buttonStep={1}
          inputStep={1}
          accentClass="accent-blue-400"
          ariaLabelSlider="Origen Y (slider)"
          ariaLabelDec="Decrementar Origen Y"
          ariaLabelInc="Incrementar Origen Y"
          ariaLabelInput="Origen Y (px)"
          minusTitle="-1 px"
          plusTitle={"+1 px"}
          resetValue={0}
          numberInputWidthClass="w-14"
        />
      </div>
      <div className="text-[11px] text-neutral-500 mt-2">Offset Y: {cal.originY}px (rango {MIN_ORIGIN}..{MAX_ORIGIN})</div>

      {/* Pitch scale X */}
      <div className="mt-4">
        <ControlRow
          label="Escala de Pitch X"
          value={cal.pitchScaleX}
          onChange={(v) => dispatch(setCalibrationPitchScaleX(v))}
          min={MIN_SCALE}
          max={MAX_SCALE}
          sliderStep={0.005}
          buttonStep={0.005}
          inputStep={0.01}
          accentClass="accent-blue-400"
          ariaLabelSlider="Escala de pitch X (slider)"
          ariaLabelDec="Decrementar Pitch X"
          ariaLabelInc="Incrementar Pitch X"
          ariaLabelInput="Escala de pitch X (factor)"
          minusTitle="-0.005"
          plusTitle={"+0.005"}
          resetValue={1}
          numberInputWidthClass="w-16"
        />
      </div>
      <div className="text-[11px] text-neutral-500 mt-2">Pitch X = base × {cal.pitchScaleX.toFixed(3)} (rango {MIN_SCALE}..{MAX_SCALE})</div>

      {/* Pitch scale Y */}
      <div className="mt-4">
        <ControlRow
          label="Escala de Pitch Y"
          value={cal.pitchScaleY}
          onChange={(v) => dispatch(setCalibrationPitchScaleY(v))}
          min={MIN_SCALE}
          max={MAX_SCALE}
          sliderStep={0.005}
          buttonStep={0.005}
          inputStep={0.01}
          accentClass="accent-blue-400"
          ariaLabelSlider="Escala de pitch Y (slider)"
          ariaLabelDec="Decrementar Pitch Y"
          ariaLabelInc="Incrementar Pitch Y"
          ariaLabelInput="Escala de pitch Y (factor)"
          minusTitle="-0.005"
          plusTitle={"+0.005"}
          resetValue={1}
          numberInputWidthClass="w-16"
        />
      </div>
      <div className="text-[11px] text-neutral-500 mt-2">Pitch Y = base × {cal.pitchScaleY.toFixed(3)} (rango {MIN_SCALE}..{MAX_SCALE})</div>
    </>
  );
}
