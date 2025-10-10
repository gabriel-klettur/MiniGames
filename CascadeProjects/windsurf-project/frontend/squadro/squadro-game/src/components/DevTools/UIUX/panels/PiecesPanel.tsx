import { useAppDispatch, useAppSelector } from '../../../../store/hooks.ts';
import type { RootState } from '../../../../store/index.ts';
import { setShowPieces, setPieceScale, setPieceHeightLight, setPieceHeightDark, setPieceWidthScaleLight, setPieceWidthScaleDark } from '../../../../store/gameSlice.ts';
import { MIN_HEIGHT, MAX_HEIGHT, MIN_WS, MAX_WS, DEFAULT_PIECE_SCALE, DEFAULT_HEIGHT } from '../utils/constants.ts';
import ControlRow from '../components/ControlRow.tsx';

export default function PiecesPanel() {
  const dispatch = useAppDispatch();
  const showPieces = useAppSelector((s: RootState) => s.game.ui.showPieces) ?? true;
  const pieceScale = useAppSelector((s: RootState) => s.game.ui.pieceScale) ?? DEFAULT_PIECE_SCALE;
  const heightLight = useAppSelector((s: RootState) => s.game.ui.pieceHeightLight ?? s.game.ui.pieceHeight ?? DEFAULT_HEIGHT);
  const heightDark = useAppSelector((s: RootState) => s.game.ui.pieceHeightDark ?? s.game.ui.pieceHeight ?? DEFAULT_HEIGHT);
  const widthScaleLight = useAppSelector((s: RootState) => s.game.ui.pieceWidthScaleLight ?? 1);
  const widthScaleDark = useAppSelector((s: RootState) => s.game.ui.pieceWidthScaleDark ?? 1);

  return (
    <>
      <h3 className="text-xs font-semibold text-neutral-300 mb-2">Fichas</h3>
      {/* Pieces visibility */}
      <div className="mb-3 flex flex-wrap items-center gap-4">
        <label className="inline-flex items-center gap-2 text-xs text-neutral-300">
          <input
            type="checkbox"
            checked={!!showPieces}
            onChange={(e) => dispatch(setShowPieces(e.target.checked))}
            className="accent-amber-400"
          />
          Mostrar fichas
        </label>
      </div>

      {/* Piece Scale */}
      <div className="mt-5">
        <ControlRow
          label="Tamaño de ficha"
          value={pieceScale}
          onChange={(v) => dispatch(setPieceScale(v))}
          min={0.3}
          max={2.0}
          sliderStep={0.01}
          buttonStep={0.01}
          inputStep={0.01}
          accentClass="accent-amber-400"
          ariaLabelSlider="Escala de ficha (slider)"
          ariaLabelDec="Decrementar tamaño de ficha"
          ariaLabelInc="Incrementar tamaño de ficha"
          ariaLabelInput="Escala de ficha (factor)"
          minusTitle="-0.01"
          plusTitle={"+0.01"}
          resetValue={DEFAULT_PIECE_SCALE}
          numberInputWidthClass="w-16"
        />
      </div>
      <div className="text-[11px] text-neutral-500 mt-2">Ancho = base × {pieceScale.toFixed(2)} (rango 0.30..2.00)</div>

      {/* Piece per-owner PX control (observed as width) */}
      <div className="mt-5">
        <ControlRow
          label="Ancho fichas (Amarillas)"
          value={heightLight}
          onChange={(v) => dispatch(setPieceHeightLight(v))}
          min={MIN_HEIGHT}
          max={MAX_HEIGHT}
          sliderStep={1}
          buttonStep={1}
          inputStep={1}
          accentClass="accent-amber-400"
          ariaLabelSlider="Ancho fichas Amarillas (px)"
          ariaLabelDec="Reducir ancho (Light)"
          ariaLabelInc="Aumentar ancho (Light)"
          ariaLabelInput="Ancho Amarillas (px)"
          minusTitle="-1 px"
          plusTitle={"+1 px"}
          resetValue={DEFAULT_HEIGHT}
          numberInputWidthClass="w-16"
        />
      </div>
      <div className="text-[11px] text-neutral-500 mt-2">Ancho (Amarillas): {heightLight}px (rango {MIN_HEIGHT}..{MAX_HEIGHT})</div>

      <div className="mt-4">
        <ControlRow
          label="Ancho fichas (Rojas)"
          value={heightDark}
          onChange={(v) => dispatch(setPieceHeightDark(v))}
          min={MIN_HEIGHT}
          max={MAX_HEIGHT}
          sliderStep={1}
          buttonStep={1}
          inputStep={1}
          accentClass="accent-rose-400"
          ariaLabelSlider="Ancho fichas Rojas (px)"
          ariaLabelDec="Reducir ancho (Dark)"
          ariaLabelInc="Aumentar ancho (Dark)"
          ariaLabelInput="Ancho Rojas (px)"
          minusTitle="-1 px"
          plusTitle={"+1 px"}
          resetValue={DEFAULT_HEIGHT}
          numberInputWidthClass="w-16"
        />
      </div>
      <div className="text-[11px] text-neutral-500 mt-2">Ancho (Rojas): {heightDark}px (rango {MIN_HEIGHT}..{MAX_HEIGHT})</div>

      {/* Piece per-owner relative control (observed as height/length) */}
      <div className="mt-5">
        <ControlRow
          label="Largo relativo (Amarillas)"
          value={widthScaleLight}
          onChange={(v) => dispatch(setPieceWidthScaleLight(v))}
          min={MIN_WS}
          max={MAX_WS}
          sliderStep={0.05}
          buttonStep={0.05}
          inputStep={0.05}
          accentClass="accent-amber-400"
          ariaLabelSlider="Largo relativo Amarillas (×)"
          ariaLabelDec="Reducir largo (Light)"
          ariaLabelInc="Aumentar largo (Light)"
          ariaLabelInput="Largo relativo Amarillas (×)"
          minusTitle="-0.05×"
          plusTitle={"+0.05×"}
          resetValue={1}
          numberInputWidthClass="w-16"
        />
      </div>
      <div className="text-[11px] text-neutral-500 mt-2">Largo (Amarillas): ×{widthScaleLight.toFixed(2)} (rango {MIN_WS}..{MAX_WS})</div>

      <div className="mt-4">
        <ControlRow
          label="Largo relativo (Rojas)"
          value={widthScaleDark}
          onChange={(v) => dispatch(setPieceWidthScaleDark(v))}
          min={MIN_WS}
          max={MAX_WS}
          sliderStep={0.05}
          buttonStep={0.05}
          inputStep={0.05}
          accentClass="accent-rose-400"
          ariaLabelSlider="Largo relativo Rojas (×)"
          ariaLabelDec="Reducir largo (Dark)"
          ariaLabelInc="Aumentar largo (Dark)"
          ariaLabelInput="Largo relativo Rojas (×)"
          minusTitle="-0.05×"
          plusTitle={"+0.05×"}
          resetValue={1}
          numberInputWidthClass="w-16"
        />
      </div>
      <div className="text-[11px] text-neutral-500 mt-2">Largo (Rojas): ×{widthScaleDark.toFixed(2)} (rango {MIN_WS}..{MAX_WS})</div>
    </>
  );
}
