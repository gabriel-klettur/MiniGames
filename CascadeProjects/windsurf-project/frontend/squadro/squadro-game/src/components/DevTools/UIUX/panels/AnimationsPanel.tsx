import React from 'react';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks.ts';
import type { RootState } from '../../../../store/index.ts';
import { setPieceAnimMs } from '../../../../store/gameSlice.ts';
import { MIN_ANIM_MS, MAX_ANIM_MS, DEFAULT_ANIM_MS } from '../utils/constants.ts';
import ControlRow from '../components/ControlRow.tsx';

export default function AnimationsPanel() {
  const dispatch = useAppDispatch();
  const pieceAnimMs = useAppSelector((s: RootState) => s.game.ui.pieceAnimMs) ?? DEFAULT_ANIM_MS;

  return (
    <>
      <h3 className="text-xs font-semibold text-neutral-300 mb-2">Animaciones</h3>
      {/* Movement speed (animation duration) */}
      <div className="mt-5">
        <ControlRow
          label="Velocidad de movimiento"
          value={pieceAnimMs}
          onChange={(v) => dispatch(setPieceAnimMs(v))}
          min={MIN_ANIM_MS}
          max={MAX_ANIM_MS}
          sliderStep={25}
          buttonStep={25}
          inputStep={5}
          accentClass="accent-cyan-400"
          ariaLabelSlider="Duración de animación (ms)"
          ariaLabelDec="Más rápido (reduce duración)"
          ariaLabelInc="Más lento (aumenta duración)"
          ariaLabelInput="Duración animación (ms)"
          minusTitle="-25 ms (más rápido)"
          plusTitle={"+25 ms (más lento)"}
          resetValue={DEFAULT_ANIM_MS}
          numberInputWidthClass="w-20"
        />
      </div>
      <div className="text-[11px] text-neutral-500 mt-2">Transición por paso: {pieceAnimMs} ms (0 = instantáneo)</div>
    </>
  );
}
