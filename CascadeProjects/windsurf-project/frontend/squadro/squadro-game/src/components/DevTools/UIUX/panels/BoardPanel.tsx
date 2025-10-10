import { useAppDispatch, useAppSelector } from '../../../../store/hooks.ts';
import type { RootState } from '../../../../store/index.ts';
import { setBoardScale } from '../../../../store/gameSlice.ts';
import { MIN_BOARD_SCALE, MAX_BOARD_SCALE, DEFAULT_BOARD_SCALE } from '../utils/constants.ts';
import ControlRow from '../components/ControlRow.tsx';

export default function BoardPanel() {
  const dispatch = useAppDispatch();
  const boardScale = useAppSelector((s: RootState) => (s.game.ui as any)?.boardScale) ?? DEFAULT_BOARD_SCALE;

  return (
    <>
      <h3 className="text-xs font-semibold text-neutral-300 mb-2">Tablero</h3>
      <div className="mt-5">
        <ControlRow
          label="Tamaño del tablero"
          value={boardScale}
          onChange={(v) => dispatch(setBoardScale(v))}
          min={MIN_BOARD_SCALE}
          max={MAX_BOARD_SCALE}
          sliderStep={0.01}
          buttonStep={0.01}
          inputStep={0.01}
          accentClass="accent-emerald-400"
          ariaLabelSlider="Escala del tablero (×)"
          ariaLabelDec="Reducir tamaño de tablero"
          ariaLabelInc="Aumentar tamaño de tablero"
          ariaLabelInput="Escala del tablero (×)"
          minusTitle="-0.01×"
          plusTitle={"+0.01×"}
          resetValue={DEFAULT_BOARD_SCALE}
          numberInputWidthClass="w-16"
        />
      </div>
      <div className="text-[11px] text-neutral-500 mt-2">Escala tablero: ×{boardScale.toFixed(2)} (rango {MIN_BOARD_SCALE}..{MAX_BOARD_SCALE.toFixed(2)})</div>
    </>
  );
}
