import { useAppDispatch, useAppSelector } from '../../store/hooks';
import type { RootState } from '../../store';
import { setPieceWidth, setPieceHeight } from '../../store/gameSlice';
import Button from '../ui/Button';

export default function UIUX() {
  const dispatch = useAppDispatch();
  const pieceWidth = useAppSelector((s: RootState) => s.game.ui.pieceWidth);
  const pieceHeight = useAppSelector((s: RootState) => s.game.ui.pieceHeight);

  const MIN_W = 8;
  const MAX_W = 48;
  const MIN_H = 24;
  const MAX_H = 120;

  const handleChangeWidth = (val: number) => {
    if (Number.isFinite(val)) {
      const clamped = Math.max(MIN_W, Math.min(MAX_W, Math.round(val)));
      dispatch(setPieceWidth(clamped));
    }
  };
  const handleChangeHeight = (val: number) => {
    if (Number.isFinite(val)) {
      const clamped = Math.max(MIN_H, Math.min(MAX_H, Math.round(val)));
      dispatch(setPieceHeight(clamped));
    }
  };

  return (
    <div className="mt-3 w-full rounded-lg border border-neutral-800 bg-neutral-900/70 p-3 overflow-hidden">
      <h3 className="text-xs font-semibold text-neutral-300 mb-2">UI / UX</h3>
      {/* Row: Width */}
      <div className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-2 w-full">
        <label className="text-xs text-neutral-400 whitespace-nowrap">Ancho de ficha</label>
        <input
          type="range"
          min={MIN_W}
          max={MAX_W}
          step={1}
          value={pieceWidth}
          onChange={(e) => handleChangeWidth(Number(e.target.value))}
          className="min-w-0 w-full accent-amber-400"
          aria-label="Ancho de ficha (slider)"
        />
        <input
          type="number"
          min={MIN_W}
          max={MAX_W}
          step={1}
          value={pieceWidth}
          onChange={(e) => handleChangeWidth(Number(e.target.value))}
          className="w-12 rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1 text-xs text-neutral-100 text-center"
          aria-label="Ancho de ficha (px)"
        />
        <Button
          size="sm"
          variant="primary"
          onClick={() => handleChangeWidth(16)}
          title="Restablecer a 16 px"
        >
          Reset
        </Button>
      </div>
      <div className="text-[11px] text-neutral-500 mt-2">Ancho actual: {pieceWidth}px (min {MIN_W}px, máx {MAX_W}px)</div>

      {/* Row: Height */}
      <div className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-2 w-full mt-4">
        <label className="text-xs text-neutral-400 whitespace-nowrap">Alto de ficha</label>
        <input
          type="range"
          min={MIN_H}
          max={MAX_H}
          step={1}
          value={pieceHeight}
          onChange={(e) => handleChangeHeight(Number(e.target.value))}
          className="min-w-0 w-full accent-amber-400"
          aria-label="Alto de ficha (slider)"
        />
        <input
          type="number"
          min={MIN_H}
          max={MAX_H}
          step={1}
          value={pieceHeight}
          onChange={(e) => handleChangeHeight(Number(e.target.value))}
          className="w-12 rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1 text-xs text-neutral-100 text-center"
          aria-label="Alto de ficha (px)"
        />
        <Button
          size="sm"
          variant="primary"
          onClick={() => handleChangeHeight(44)}
          title="Restablecer a 44 px"
        >
          Reset
        </Button>
      </div>
      <div className="text-[11px] text-neutral-500 mt-2">Alto actual: {pieceHeight}px (min {MIN_H}px, máx {MAX_H}px)</div>
    </div>
  );
}

